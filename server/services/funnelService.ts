import { storage } from "../storage";
import { whatsappService } from "./whatsappService";
import type { Funnel, FunnelExecution, Contact } from "@shared/schema";

// Import schedulerService dynamically to avoid circular dependency
const getSchedulerService = async () => {
  const { schedulerService } = await import('./schedulerService');
  return schedulerService;
};

interface FunnelNodeData {
  id: string;
  type: string;
  data: {
    content?: string;
    mediaUrl?: string;
    delayMinutes?: number;
    conditions?: any;
  };
  position: { x: number; y: number };
}

export class FunnelService {
  async executeFunnel(funnelId: string, contactId: string, triggerMessage?: string): Promise<void> {
    try {
      const funnel = await storage.getFunnel(funnelId);
      if (!funnel || funnel.status !== 'active') {
        throw new Error('Funnel not found or not active');
      }

      const contact = await storage.getContactById(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Create funnel execution record
      const execution = await storage.createFunnelExecution({
        funnelId,
        contactId,
        currentNodeId: null,
        status: 'active',
        completedAt: null,
        data: { triggerMessage },
      });

      // Start funnel execution from the first node
      await this.processNextNode(execution.id);
    } catch (error) {
      console.error('Execute funnel error:', error);
      throw error;
    }
  }

  async processNextNode(executionId: string): Promise<void> {
    try {
      // Use getFunnelExecution (not update with empty object) to read current state
      const execution = await storage.getFunnelExecution(executionId);
      if (!execution || execution.status !== 'active') {
        return;
      }

      const funnel = await storage.getFunnel(execution.funnelId);
      if (!funnel) {
        return;
      }

      const flowData = funnel.flowData as { nodes: FunnelNodeData[], edges: any[] };

      // Helper to check if a node is a trigger node
      const isTriggerNode = (node: FunnelNodeData) =>
        node.type === 'trigger' || (node.data as any)?.nodeType === 'trigger';

      let currentNode: FunnelNodeData | undefined;

      if (!execution.currentNodeId) {
        // First call: start with the trigger node
        currentNode = flowData.nodes.find(node => isTriggerNode(node));
      } else {
        // Subsequent calls: advance to the NEXT node based on edges
        const nextEdge = flowData.edges.find(edge => edge.source === execution.currentNodeId);
        if (nextEdge) {
          currentNode = flowData.nodes.find(node => node.id === nextEdge.target);
        }
        // If no next edge, currentNode stays undefined → end of funnel
      }

      if (!currentNode) {
        // End of funnel — no more nodes to process
        await storage.updateFunnelExecution(executionId, {
          status: 'completed',
          completedAt: new Date(),
        });
        console.log(`✅ Funil ${execution.funnelId} concluído para execução ${executionId}`);
        return;
      }

      // Get the canonical node type
      const currentNodeType = (currentNode.data as any)?.nodeType || currentNode.type;

      // Process the current node
      await this.processNode(execution, currentNode);

      // Record which node we just processed
      await storage.updateFunnelExecution(executionId, {
        currentNodeId: currentNode.id,
      });

      // Trigger node: skip delay logic, advance immediately
      if (isTriggerNode(currentNode)) {
        setTimeout(() => this.processNextNode(executionId), 500);
        return;
      }

      // Delay node: schedule the next step
      if (currentNodeType === 'delay') {
        const delayMinutes = currentNode.data.delayMinutes || 0;
        if (delayMinutes > 0) {
          const schedulerService = await getSchedulerService();
          await schedulerService.scheduleTask({
            type: 'funnel_next_node',
            data: { executionId },
            executeAt: new Date(Date.now() + delayMinutes * 60 * 1000),
          });
          console.log(`⏰ Aguardando ${delayMinutes} minuto(s) antes da próxima mensagem`);
          return;
        }
      }

      // All other nodes: advance to next immediately (1 s gap to avoid flooding)
      setTimeout(() => this.processNextNode(executionId), 1000);
    } catch (error) {
      console.error('Process next node error:', error);
      await storage.updateFunnelExecution(executionId, {
        status: 'stopped',
        completedAt: new Date(),
      });
    }
  }

  private async processNode(execution: FunnelExecution, node: FunnelNodeData): Promise<void> {
    const contact = await storage.getContactById(execution.contactId);
    if (!contact) {
      throw new Error('Contact not found for execution');
    }

    // Get the actual node type (check both type and data.nodeType)
    const nodeType = (node.data as any)?.nodeType || node.type;

    switch (nodeType) {
      case 'trigger':
        // Trigger node - just log the start, DO NOT send any message
        console.log(`Funnel started for contact ${contact.phoneNumber}`);
        break;

      case 'message':
        await this.sendMessage(contact, node);
        break;

      case 'delay':
        // Delay is handled in the scheduling logic
        console.log(`Waiting ${node.data.delayMinutes} minutes for contact ${contact.phoneNumber}`);
        break;

      case 'condition':
        // Handle conditional logic
        await this.processCondition(execution, node);
        break;

      default:
        console.log(`Unknown node type: ${nodeType}`);
    }
  }

  private async sendMessage(contact: Contact, node: FunnelNodeData): Promise<void> {
    try {
      const messageContent = node.data.content || '';
      const mediaUrl = node.data.mediaUrl;

      // Determine message type based on content
      let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text';
      if (mediaUrl) {
        if (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
          messageType = 'image';
        } else if (mediaUrl.match(/\.(mp4|avi|mov)$/i)) {
          messageType = 'video';
        } else if (mediaUrl.match(/\.(mp3|wav|ogg)$/i)) {
          messageType = 'audio';
        } else {
          messageType = 'document';
        }
      }

      // Send message via WhatsApp
      const success = await whatsappService.sendMessage(contact.phoneNumber, messageContent);

      // Store message record
      await storage.createMessage({
        contactId: contact.id,
        userId: contact.userId,
        type: messageType,
        content: messageContent,
        mediaUrl,
        status: success ? 'sent' : 'failed',
        sentAt: new Date(),
      });

      console.log(`Message sent to ${contact.phoneNumber}: ${messageContent}`);
    } catch (error) {
      console.error('Send message error:', error);
      
      // Store failed message record
      await storage.createMessage({
        contactId: contact.id,
        userId: contact.userId,
        type: 'text',
        content: node.data.content || '',
        mediaUrl: node.data.mediaUrl,
        status: 'failed',
      });
    }
  }

  private async processCondition(execution: FunnelExecution, node: FunnelNodeData): Promise<void> {
    // Handle conditional logic based on node configuration
    // This is a simplified version - in a real implementation,
    // you'd evaluate conditions based on contact data, previous responses, etc.
    
    const conditions = node.data.conditions || {};
    console.log(`Processing condition for execution ${execution.id}:`, conditions);
    
    // For now, we'll just continue to the next node
    // In a real implementation, you'd evaluate the condition and choose the appropriate path
  }

  async pauseFunnel(funnelId: string): Promise<void> {
    await storage.updateFunnel(funnelId, { status: 'paused' });
    
    // Also pause all active executions for this funnel
    const executions = await storage.getFunnelExecutions(funnelId);
    for (const execution of executions) {
      if (execution.status === 'active') {
        await storage.updateFunnelExecution(execution.id, { status: 'stopped' });
      }
    }
  }

  async resumeFunnel(funnelId: string): Promise<void> {
    await storage.updateFunnel(funnelId, { status: 'active' });
  }

  async stopFunnelExecution(executionId: string): Promise<void> {
    await storage.updateFunnelExecution(executionId, {
      status: 'stopped',
      completedAt: new Date(),
    });
  }

  async getFunnelStats(funnelId: string): Promise<any> {
    const executions = await storage.getFunnelExecutions(funnelId);
    
    const stats = {
      totalExecutions: executions.length,
      activeExecutions: executions.filter(e => e.status === 'active').length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      stoppedExecutions: executions.filter(e => e.status === 'stopped').length,
    };

    return stats;
  }
}

export const funnelService = new FunnelService();
