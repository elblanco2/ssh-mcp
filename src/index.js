import { program } from 'commander';
import { connect } from './client.js';
import { startServer } from './server.js';

program
  .name('ssh-mcp')
  .description('MCP for managing remote files over SSH')
  .version('0.1.0');

program
  .command('connect')
  .description('Connect to a remote server')
  .argument('<host>', 'Remote host to connect to')
  .option('-p, --port <port>', 'SSH port', '22')
  .option('-u, --username <username>', 'SSH username')
  .action(connect);

program
  .command('serve')
  .description('Start the MCP server')
  .option('-p, --port <port>', 'WebSocket port', '8080')
  .action(startServer);

program.parse();