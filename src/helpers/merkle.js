import { ethers } from "ethers";

// given a list of leaves, generates the proof data needed
// array of [account, amount] entrys
export function generateMerkle (data) {
  let tree = [];

  let leaves = data.map((x) =>
    ethers.utils.solidityKeccak256(["address", "uint256"], [x[0], x[1]])
  );

  tree.push(leaves);

  // loop until we have one node left
  while (leaves.length > 1) {
    let level = [];
    // for each current leaf, compute parents
    for (let i = 0; i < leaves.length; i += 2) {
      let leftChild = leaves[i];
      let rightChild;
      //If we have an odd number of nodes, just use this leaf again
      if (i === leaves.length - 1) {
        rightChild = leaves[i];
      } else {
        rightChild = leaves[i + 1];
      }

      //compute hash
      let currHash;
      if (parseInt(leftChild, 16) > parseInt(rightChild, 16)) {
        currHash = ethers.utils.solidityKeccak256(
          ["bytes32", "bytes32"],
          [leftChild, rightChild]
        );
      } else {
        currHash = ethers.utils.solidityKeccak256(
          ["bytes32", "bytes32"],
          [rightChild, leftChild]
        );
      }
      level.push(currHash);
    }
    tree.push(level);
    leaves = level;
  }
  return tree;
};

export function generateProof (data, account) {
  if (!data?.length || !account) {
    return; 
  }
  let matchingLeaf;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0].toLowerCase() === account.toLowerCase()) {
        matchingLeaf = {
            entryData: data[i],
            index: i,
        };
        //assumption: single address does not appear more than once
        break;
    }
  }
  if (matchingLeaf === undefined) {
    return { error: "Not in proof" };
  }

  // we now have our leafs starting index. Generate an array of entries
  // start at the base of the tree and at index i
  let currentId = matchingLeaf.index;
  let tree = this.generateMerkle(data);

  //for each level, find the corresponding entry needed and add to our array
  let proofData = [];
  tree.forEach((level) => {
    if (level.length !== 1) {
        //skip the root
        //get the pair id for the current element
        let pairId = currentId % 2 === 0 ? currentId + 1 : currentId - 1;
        //this happens when we are at the last id in the level (eg currentId + 1 does not exist)
        //this CANT happen when currentId - 1 doesn't exist as that implies currentId = 0, however 0 % 2 = true therefor you would be in a + 1 state. Contradiction
        if (level[pairId] === undefined) {
            // simply use yourself as in the merkle generation
            pairId = currentId
        }
        proofData.push(level[pairId]);
        // move to the next level and reset our id
        currentId = Math.floor(currentId / 2);
    }
  });

  return { proofData, amount: matchingLeaf.entryData[1] };
}
