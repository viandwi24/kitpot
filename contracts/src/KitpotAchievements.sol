// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title KitpotAchievements — Soulbound (non-transferable) achievement NFTs
/// @notice Awards milestone badges to members. On-chain SVG metadata, no IPFS needed.
contract KitpotAchievements is ERC721, Ownable {
    using Strings for uint256;

    // ============================================================
    //                          ENUMS
    // ============================================================

    enum AchievementType {
        FirstCircleJoined,    // 0
        FirstPotReceived,     // 1
        CircleCompleted,      // 2
        PerfectCircle,        // 3
        Streak3,              // 4
        Streak10,             // 5
        Streak25,             // 6
        CircleCreator,        // 7
        HighRoller,           // 8
        Veteran,              // 9
        DiamondTier,          // 10
        EarlyAdopter          // 11
    }

    // ============================================================
    //                         STRUCTS
    // ============================================================

    struct Achievement {
        AchievementType achievementType;
        address holder;
        uint256 earnedAt;
        uint256 circleId;
    }

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(AchievementType => bool)) public hasAchievement;
    mapping(address => uint256[]) public memberTokenIds;
    uint256 public nextTokenId;

    mapping(address => bool) public authorized;

    uint256 public earlyAdopterDeadline; // timestamp

    // Achievement metadata
    string[12] public achievementNames = [
        "First Circle",
        "First Pot",
        "Circle Complete",
        "Perfect Circle",
        "Streak 3",
        "Streak 10",
        "Streak 25",
        "Circle Creator",
        "High Roller",
        "Veteran",
        "Diamond",
        "Early Adopter"
    ];

    string[12] public achievementDescriptions = [
        "Joined your first savings circle",
        "Received your first pot payout",
        "Completed a full savings circle",
        "Completed a circle with 100% on-time payments",
        "3 consecutive on-time payments",
        "10 consecutive on-time payments",
        "25 consecutive on-time payments",
        "Created a circle that completed successfully",
        "Participated in a circle with 500+ USDC contribution",
        "Completed 5+ circles",
        "Achieved Diamond trust tier",
        "Joined during the launch period"
    ];

    // SVG colors per achievement type
    string[12] internal _colors = [
        "#5BC28E", "#ABFED5", "#34D399", "#10B981",
        "#F59E0B", "#F97316", "#EF4444",
        "#6366F1", "#8B5CF6",
        "#14B8A6", "#06B6D4", "#EC4899"
    ];

    // ============================================================
    //                         EVENTS
    // ============================================================

    event AchievementAwarded(address indexed holder, AchievementType indexed achievementType, uint256 tokenId, uint256 circleId);

    // ============================================================
    //                      CONSTRUCTOR
    // ============================================================

    constructor(uint256 _earlyAdopterDeadline) ERC721("Kitpot Achievements", "KPOT") Ownable(msg.sender) {
        earlyAdopterDeadline = _earlyAdopterDeadline;
    }

    // ============================================================
    //                   SOULBOUND OVERRIDE
    // ============================================================

    /// @notice Prevents transfers — tokens are soulbound
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    // ============================================================
    //                    ADMIN FUNCTIONS
    // ============================================================

    function setAuthorized(address caller, bool status) external onlyOwner {
        authorized[caller] = status;
    }

    // ============================================================
    //                   AWARD FUNCTIONS
    // ============================================================

    /// @notice Award an achievement to a member (idempotent — skips if already awarded)
    function award(address member, AchievementType aType, uint256 circleId) external {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        if (hasAchievement[member][aType]) return; // already has it

        uint256 tokenId = nextTokenId++;
        achievements[tokenId] = Achievement({
            achievementType: aType,
            holder: member,
            earnedAt: block.timestamp,
            circleId: circleId
        });

        hasAchievement[member][aType] = true;
        memberTokenIds[member].push(tokenId);

        _safeMint(member, tokenId);
        emit AchievementAwarded(member, aType, tokenId, circleId);
    }

    /// @notice Award early adopter badge (callable by anyone, checks deadline)
    function claimEarlyAdopter(address member) external {
        require(block.timestamp <= earlyAdopterDeadline, "Early adopter period ended");
        if (hasAchievement[member][AchievementType.EarlyAdopter]) return;

        uint256 tokenId = nextTokenId++;
        achievements[tokenId] = Achievement({
            achievementType: AchievementType.EarlyAdopter,
            holder: member,
            earnedAt: block.timestamp,
            circleId: 0
        });

        hasAchievement[member][AchievementType.EarlyAdopter] = true;
        memberTokenIds[member].push(tokenId);

        _safeMint(member, tokenId);
        emit AchievementAwarded(member, AchievementType.EarlyAdopter, tokenId, 0);
    }

    // ============================================================
    //                    VIEW FUNCTIONS
    // ============================================================

    function getAchievements(address member) external view returns (uint256[] memory) {
        return memberTokenIds[member];
    }

    function achievementCount(address member) external view returns (uint256) {
        return memberTokenIds[member].length;
    }

    function has(address member, AchievementType aType) external view returns (bool) {
        return hasAchievement[member][aType];
    }

    // ============================================================
    //                    ON-CHAIN METADATA
    // ============================================================

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Achievement memory a = achievements[tokenId];
        uint8 typeIndex = uint8(a.achievementType);

        string memory svg = _generateSVG(typeIndex);
        string memory json = string(abi.encodePacked(
            '{"name":"Kitpot: ', achievementNames[typeIndex],
            '","description":"', achievementDescriptions[typeIndex],
            '","image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Achievement","value":"', achievementNames[typeIndex],
            '"},{"trait_type":"Earned","display_type":"date","value":', a.earnedAt.toString(),
            '}]}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _generateSVG(uint8 typeIndex) internal view returns (string memory) {
        string memory color = _colors[typeIndex];
        string memory name = achievementNames[typeIndex];

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" rx="32" fill="#0a0f0d"/>',
            '<circle cx="200" cy="160" r="80" fill="', color, '" opacity="0.15"/>',
            '<circle cx="200" cy="160" r="50" fill="', color, '" opacity="0.3"/>',
            '<circle cx="200" cy="160" r="20" fill="', color, '"/>',
            '<text x="200" y="280" text-anchor="middle" fill="', color, '" font-family="sans-serif" font-size="20" font-weight="bold">', name, '</text>',
            '<text x="200" y="320" text-anchor="middle" fill="#86a896" font-family="sans-serif" font-size="12">Kitpot Achievement</text>',
            '<text x="200" y="370" text-anchor="middle" fill="#2a3f32" font-family="sans-serif" font-size="10">Soulbound - Non-transferable</text>',
            '</svg>'
        ));
    }
}
