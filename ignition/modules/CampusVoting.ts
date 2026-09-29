import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CampusVotingModule = buildModule("CampusVotingModule", (m) => {
  const campusVoting = m.contract("CampusVoting");

  return { campusVoting };
});

export default CampusVotingModule;