const { compileCircuit } = require('../lib/compile');
const { testCircuit } = require('../lib/test');
const { deployVerifier } = require('../lib/deploy');
const { verify_proof }= require('../lib/verify');


module.exports = {
    verify_proof,
    compileCircuit,
    testCircuit,
    deployVerifier
};