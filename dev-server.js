import { spawn } from 'node:child_process';

// Exclude arguments and parameters that Next.js doesn't support
const rawArgs = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--host') {
    // Skip '--host'
    // If the next token is an IP or host name (not another flag), skip that as well
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
      i++;
    }
  } else if (arg.startsWith('--host=')) {
    // Skip '--host=0.0.0.0' or similar
    continue;
  } else {
    filteredArgs.push(arg);
  }
}

// Add Next.js standard options if they are not explicitly overridden
if (!filteredArgs.includes('-p') && !filteredArgs.includes('--port')) {
  filteredArgs.push('-p', '3000');
}
if (!filteredArgs.includes('-H') && !filteredArgs.includes('--hostname')) {
  filteredArgs.push('-H', '0.0.0.0');
}

console.log('[Dev-Server] Stripping unsupported options and launching Next.js dev...');
console.log('[Dev-Server] Launching: next dev', filteredArgs.join(' '));

const child = spawn('npx', ['next', 'dev', ...filteredArgs], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[Dev-Server] Failed to start next dev:', err);
  process.exit(1);
});
