// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CampusVoting {
    address public admin;

    struct Proposal {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Proposal[] public proposals;
    mapping(address => bool) public hasVoted;

    event ProposalAdded(uint256 indexed proposalId, string name);
    event Voted(address indexed voter, uint256 indexed proposalId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addProposal(string memory _name) external onlyAdmin {
        uint256 proposalId = proposals.length;
        proposals.push(Proposal({ id: proposalId, name: _name, voteCount: 0 }));
        emit ProposalAdded(proposalId, _name);
    }

    function vote(uint256 _proposalId) external {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_proposalId < proposals.length, "Invalid proposal ID");

        hasVoted[msg.sender] = true;
        proposals[_proposalId].voteCount++;

        emit Voted(msg.sender, _proposalId);
    }

    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
}