#!/usr/bin/env node

const { program } = require('commander');
const { compileCircuit } = require('../lib/compile');

program
  .command('compile <circomFilePath>')
  .description('Compile a circom circuit')
  .action((circomFilePath) => {
    compileCircuit(circomFilePath);
  });

  

program.parse(process.argv);        