import { WebSocketServer } from 'ws';
import chalk from 'chalk';

export function startServer(options) {
  const wss = new WebSocketServer({ port: options.port });

  console.log(chalk.green(`✓ MCP server started on port ${options.port}`));

  wss.on('connection', (ws) => {
    console.log(chalk.blue('→ Client connected'));

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        console.log(chalk.gray(`Received ${msg.type} command for ${msg.path || 'unknown path'}`));
        
        // Messages will be handled by the client's SFTP implementation
        // The server just acts as a relay
        ws.send(JSON.stringify({
          type: 'ack',
          messageId: msg.messageId
        }));
      } catch (err) {
        console.error(chalk.red('Error processing message:'), err.message);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log(chalk.yellow('→ Client disconnected'));
    });

    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket Error:'), error.message);
    });
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down server...'));
    wss.close();
    process.exit(0);
  });
}