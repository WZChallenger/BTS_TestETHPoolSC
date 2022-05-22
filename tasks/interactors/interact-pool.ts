import { task } from "hardhat/config";
import { resolve } from "path";
import * as dotenv from "dotenv";
import { 
  BTSETHPool__factory,
} from "../../typechain-types";


dotenv.config({ path: resolve(__dirname, "../../.env") });

task("interact-pool")
  .setDescription('Interact with pool as the simulation case on Ropsten.')
  .setAction(async (taskArgs, { ethers, run }) => {
    const signers = await ethers.getSigners();

    const pool = await new BTSETHPool__factory(signers[0]);
    const box = await pool.attach(process.env.POOL_ADDRESS as string);

    const signerA = box.connect(signers[1]);
    const signerB = box.connect(signers[2]);
    const signerT = box.connect(signers[0]);

    const depositA = await signerA.deposit({from: signers[1].address, value: 10 ** 15});
    await depositA.wait();
    console.log('A deposit 0.001 ETH');

    const depositB = await signerB.deposit({from: signers[2].address, value: 3 * (10 ** 15)});
    await depositB.wait();
    console.log('B deposit 0.003 ETH');

    const depositT = await signerT.depositRewards({from: signers[0].address, value: 2 * (10 ** 15)});
    await depositT.wait();
    console.log('T deposit 0.002 ETH');

    const claimA = await signerA.claimRewards();
    await claimA.wait();
    console.log('A withdraw');

    const claimB = await signerB.claimRewards();
    await claimB.wait();
    console.log('B withdraw');
  });
