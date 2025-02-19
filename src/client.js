import { Client } from 'ssh2';
import WebSocket from 'ws';
import chalk from 'chalk';

export async function connect(host, options) {
  const conn = new Client();
  const wsPort = options.wsPort || 8081;  // Match server's default port
  
  try {
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log(chalk.green('✓ SSH connection established'));
        resolve();
      }).connect({
        host,
        port: options.port,
        username: options.username,
        // We'll add proper authentication handling later
      });
    });

    // Set up WebSocket connection for file operations
    const ws = new WebSocket(`ws://localhost:${wsPort}`);
    
    ws.on('open', () => {
      console.log(chalk.green('✓ Connected to MCP server'));
      
      // Set up SFTP session
      conn.sftp((err, sftp) => {
        if (err) {
          console.error(chalk.red('SFTP Error:'), err.message);
          return;
        }

        // Handle file operations
        ws.on('message', async (data) => {
          const msg = JSON.parse(data);
          
          switch (msg.type) {
            case 'list':
              sftp.readdir(msg.path, (err, list) => {
                if (err) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    error: err.message
                  }));
                  return;
                }
                ws.send(JSON.stringify({
                  type: 'list',
                  path: msg.path,
                  files: list
                }));
              });
              break;

            case 'read':
              sftp.readFile(msg.path, (err, data) => {
                if (err) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    error: err.message
                  }));
                  return;
                }
                ws.send(JSON.stringify({
                  type: 'file',
                  path: msg.path,
                  content: data.toString()
                }));
              });
              break;

            case 'write':
              sftp.writeFile(msg.path, msg.content, (err) => {
                if (err) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    error: err.message
                  }));
                  return;
                }
                ws.send(JSON.stringify({
                  type: 'success',
                  message: `File ${msg.path} written successfully`
                }));
              });
              break;
          }
        });
      });
    });

    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket Error:'), error.message);
    });

    // Handle cleanup
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nClosing connections...'));
      ws.close();
      conn.end();
      process.exit(0);
    });

  } catch (err) {
    console.error(chalk.red('Error connecting:'), err.message);
    process.exit(1);
  }
}