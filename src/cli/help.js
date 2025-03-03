export const help = {
  command: "help",
  description: "Show this help message",
  handler: (commands) => {
    const helpText = ["Usage: bzz <command> [options]\n\nCommands:"];
    
    // Sort commands alphabetically but keep help last
    const sortedCommands = Object.entries(commands)
      .sort(([a], [b]) => {
        if (a === 'help') return 1;
        if (b === 'help') return -1;
        return a.localeCompare(b);
      });

    // Get the longest command length for padding
    const maxLength = Math.max(...sortedCommands.map(([_, cmd]) => cmd.command.length));
    
    for (const [_, cmd] of sortedCommands) {
      // Split multi-line descriptions
      const [firstLine, ...restLines] = cmd.description.split('\n');
      
      // Add first line with proper padding
      helpText.push(`  ${cmd.command.padEnd(maxLength + 2)} ${firstLine}`);
      
      // Add remaining lines with proper indentation
      if (restLines.length) {
        helpText.push(...restLines.map(line => 
          `  ${' '.repeat(maxLength + 2)} ${line}`
        ));
      }
    }

    console.log(helpText.join('\n'));
  }
}; 