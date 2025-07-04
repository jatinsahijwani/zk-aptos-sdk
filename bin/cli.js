#!/usr/bin/env node

const { program } = require('commander');
const { compileCircuit } = require('../lib/compile');
const { testCircuit } = require('../lib/test');
const {deploy} = require('../lib/deploy');
const { generateMoveVerifier } = require('../lib/generateMoveVerifier');

program
  .command('compile <circomFilePath>')
  .description('Compile a circom circuit')
  .action((circomFilePath) => {
    compileCircuit(circomFilePath);
  });

program
  .command('generate-move-verifier <folderPath>')
  .description('Generate Verifier.move from verification_key.json inside the given folder')
  .action((folderPath) => {
    generateMoveVerifier(folderPath);
  });

  program
  .command('test <folder> <inputJson>')
  .description('Test the circuit with input.json and generate proof/public.json')
  .action((folder, inputJson) => {
    testCircuit(folder, inputJson);
  });

  program
  .command('deploy <folderPath>')
  .description('Compile and deploy the verifier Move script to Aptos')
  .action((folderPath) => {
    deploy(folderPath);
  });

program.parse(process.argv);
