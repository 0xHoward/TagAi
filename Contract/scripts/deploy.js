const { ethers } = require('hardhat');

async function main() {
    console.log('start')
    const [signer] = await ethers.getSigners();
    console.log("deployer:", signer.address, 'balance:', await signer.provider.getBalance(signer.address), '\n', await signer.provider.getFeeData())
    // return;
    const ipshare = await ethers.deployContract('IPShare');
    console.log('IPShare:', ipshare.target)

    const pump = await ethers.deployContract('Pump', [ipshare.target])
    console.log('Pump:', pump.target)
}

main().catch(error => {
    console.error(error)
}).finally(process.exit)