import { task } from "hardhat/config";
import { 
  BTSETHPool__factory,
} from "../../typechain-types";
import sleep from "../../utils/sleep";

const VERIFY_DELAY = 100000;

task("deploy-pool")
  .addFlag("verify")
  .setAction(async (taskArgs, { ethers, run }) => {
    const signers = await ethers.getSigners();

    console.log("Deploying Pool:");
    const pool = await new BTSETHPool__factory(signers[0]).deploy();
    console.log(`Pool deployed at: ${pool.address}`);
    if (taskArgs.verify) {
      console.log("Verifying Pool, can take some time");
      await pool.deployed();
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: pool.address,
        constructorArguments: [],
      });
    }
    return pool.address;
  });
