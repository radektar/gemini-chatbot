import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connect(config: MCPServerConfig): Promise<Client> {
    // Check if already connected
    if (this.clients.has(config.name)) {
      return this.clients.get(config.name)!;
    }

    const client = new Client({
      name: `impact-chad-${config.name}`,
      version: "1.0.0",
    });

    // Filter out undefined values from process.env and config.env
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    for (const [key, value] of Object.entries(config.env || {})) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env,
    });

    await client.connect(transport);
    this.clients.set(config.name, client);
    return client;
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    // MCP returns result with content array
    // Extract the actual data from content
    if (result.content && Array.isArray(result.content)) {
      // Try to parse JSON from text content
      for (const item of result.content) {
        if (item.type === "text") {
          try {
            return JSON.parse(item.text);
          } catch {
            return item.text;
          }
        }
        if (item.type === "resource") {
          return item.data || item;
        }
      }
      // If no specific type, return first content item
      return result.content[0];
    }

    return result;
  }

  async listTools(serverName: string) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    return await client.listTools();
  }

  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      await client.close();
    }
    this.clients.clear();
  }
}

export const mcpManager = new MCPClientManager();

