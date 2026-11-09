import { spawn } from 'child_process';

console.log('🚀 Starting FinTrack Full-Stack Application (Backend + Frontend)...\n');

// Start backend API server on port 5000 (stdin ignored to prevent TTY contention)
const server = spawn('npm.cmd', ['run', 'dev'], {
  cwd: './server',
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
});

// Start frontend Vite server on port 5173 (stdin ignored to prevent TTY contention)
const client = spawn('npm.cmd', ['run', 'dev'], {
  cwd: './client',
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
});

server.on('error', (err) => console.error('❌ Server error:', err));
client.on('error', (err) => console.error('❌ Client error:', err));

const cleanup = () => {
  console.log('\n🛑 Shutting down FinTrack services...');
  server.kill();
  client.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
