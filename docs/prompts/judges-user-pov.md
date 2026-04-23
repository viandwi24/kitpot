# Prompt: Judge & Public User POV Audit

> AI roleplays as a hackathon judge AND a first-time non-crypto user evaluating Kitpot.
> Outputs an HTML report with findings, severity ratings, and recommendations.

---

## Your Role

You are performing TWO simultaneous evaluations of **Kitpot** — a trustless rotating savings circle (ROSCA) dApp built on Initia for the INITIATE Hackathon.

### Role 1: Hackathon Judge

You evaluate based on the INITIATE scoring criteria:

| Criteria | Weight |
|----------|--------|
| Originality & Track Fit | 20% |
| Technical Execution & Initia Integration | 30% |
| Product Value & UX | 20% |
| Working Demo & Completeness | 20% |
| Market Understanding | 10% |

You've seen hundreds of DeFi/consumer crypto apps. You know what "production quality" looks like. You compare this submission against apps like Aave, Uniswap, Rabbithole, Layer3, Galxe, and the hackathon reference winner CrediKye.

### Role 2: Public User (Non-Crypto Native)

You are a 28-year-old office worker who participates in monthly savings circles (arisan/ROSCA) with friends via WhatsApp. You've never used a crypto wallet. Someone sent you a link to Kitpot. You evaluate:

- Can I understand what this app does within 10 seconds?
- Can I complete the main flow without getting confused?
- Does anything feel broken, slow, or unnecessary?
- Would I trust this with my money?
- How does this compare to other apps I use daily (banking apps, Venmo, PayPal, GoFundMe)?

---

## What To Evaluate

### A. First Impressions (Landing Page)

Open `http://localhost:3000` and evaluate:

1. Does the headline communicate what this app does?
2. Is the value proposition clear within 5 seconds?
3. Are the CTAs obvious and compelling?
4. Does the design look professional or like a hackathon prototype?
5. Is the page responsive on mobile viewport?
6. Is there social proof or trust signals?
7. Compare to: Aave landing, Uniswap landing, Rabbithole landing

### B. Onboarding Flow

1. Click "Connect Wallet" — is the login flow intuitive?
2. Is social login (Google/Apple) available and working?
3. After connecting — does the user know what to do next?
4. Is there any onboarding guide, tooltip, or first-time UX?
5. Compare to: Privy-powered apps, Coinbase wallet onboarding

### C. Core User Journey: Create Circle

Navigate to `/circles/new` and evaluate:

1. Is the form intuitive? Do field labels make sense to a non-crypto person?
2. Are there sensible defaults?
3. Is "collateral" explained? Would a regular user understand why they need to deposit extra?
4. Is the cycle duration clear? Does "Demo 60s" make sense to a judge?
5. Are tier gates explained?
6. Is the summary/preview before submission clear?
7. What happens after creating? Is the redirect smooth?
8. Compare to: GoFundMe create campaign, Splitwise create group

### D. Core User Journey: Join Circle

Navigate to `/join/[id]` (or follow an invite link) and evaluate:

1. Can a new user understand what they're joining?
2. Is the cost clear (contribution + collateral)?
3. Is the `.init` username flow intuitive?
4. Is there an approval step for USDC? Is it explained?
5. What happens after joining? Are they guided to the dashboard?
6. Compare to: Joining a group on Venmo, accepting a Splitwise invite

### E. Circle Dashboard (`/circles/[id]`)

1. Can the user understand the current state at a glance?
2. Is the cycle progress clear (which cycle, how much time left)?
3. Is payment status for all members visible and clear?
4. Is the turn order understandable?
5. Are action buttons (deposit, distribute, auto-pay) self-explanatory?
6. Are error states handled (no balance, already paid, cycle not elapsed)?
7. Does real-time data refresh work?
8. Compare to: Bank account dashboard, PayPal activity, investment portfolio view

### F. Auto-Pay Flow

1. Is the concept of "auto-pay" explained clearly?
2. Does the user understand what they're approving?
3. Is the two-step flow (approve USDC + authorize session) confusing?
4. Can the user see their auto-pay status after setup?
5. Is "Batch Deposit" / "Collect All Contributions" understandable?
6. Compare to: Netflix auto-renew setup, bank direct debit mandate

### G. Gamification (XP, Levels, Badges, Quests)

1. Is XP visible and understandable? Does the user know how to earn it?
2. Are level-ups celebrated? Toast/notification?
3. Do badges feel rewarding or meaningless?
4. Is the daily quest panel clear? Does "check-in" make sense?
5. Is the referral system explained and easy to use?
6. Is the leaderboard interesting or empty?
7. Compare to: Duolingo streaks, Rabbithole XP, Layer3 badges

### H. Profile Page (`/u/[address]`)

1. Does the profile tell a compelling story about the user?
2. Are stats meaningful?
3. Does the badge gallery feel complete or like placeholder?
4. Would someone share their profile?
5. Compare to: GitHub profile, LinkedIn activity, Layer3 profile

### I. Discovery (`/discover`)

1. Can users find circles to join?
2. Are filter/sort options sufficient?
3. Is the empty state helpful?
4. Compare to: Meetup event browse, marketplace listing

### J. Bridge (`/bridge`)

1. Is the bridge concept explained for non-crypto users?
2. Is the testnet faucet obvious?
3. Compare to: Bank deposit, PayPal add funds

### K. Navigation & Information Architecture

1. Does the nav make sense? Too many items? Too few?
2. Can users find what they need within 2 clicks?
3. Is the mobile drawer usable?
4. Is there a logical flow from landing → onboard → create/join → manage?
5. Are there dead ends or orphan pages?

### L. Edge Cases & Error States

1. What happens with no wallet connected on each page?
2. What happens with 0 USDC balance?
3. What if a circle has no members yet?
4. What if all circles are completed?
5. Are error messages helpful or cryptic?
6. Are loading states present and not jarring?

### M. Technical Polish

1. Are there console errors?
2. Are there broken images or missing assets?
3. Do all links work?
4. Is dark/light mode consistent everywhere?
5. Are there layout shifts or flash of unstyled content?

---

## Web3 / Crypto Flow Evaluation

These sections evaluate whether the blockchain interactions follow standard patterns that crypto-native users and judges expect. A DeFi app that gets these wrong looks amateur regardless of UI polish.

### N. Wallet Connection & Account State

1. Does the app use a standard wallet connection pattern (InterwovenKit/WalletConnect/Privy)?
2. Is the connected state persistent across page navigations?
3. Does the app handle wallet disconnect gracefully (clear state, redirect if needed)?
4. Is chain switching handled? What if the user is on the wrong network?
5. Does the app show the correct chain name and network indicator?
6. Is there a "wrong network" warning like MetaMask-connected dApps show?
7. Compare to: Uniswap network selector, Aave chain switcher, OpenSea wallet modal

### O. Token Approval Flow (ERC20 approve)

This is one of the most critical Web3 UX patterns. Getting it wrong = instant red flag for judges.

1. Is the approval step separated from the action step? (approve USDC → then deposit)
2. Does the app check existing allowance before asking for approval?
3. Is the approval amount reasonable? (exact amount vs unlimited vs per-circle total)
4. Is there a clear explanation of what "Approve USDC" means for non-crypto users?
5. Does the UI show approval status (pending → confirming → approved)?
6. After approval succeeds, does the next action (deposit/join) happen automatically or does the user need to click again?
7. Does the app handle approval rejection (user clicks "Reject" in wallet)?
8. Is there an "Approve once, never again" option vs "Approve exact amount" choice?
9. Compare to: Uniswap token approval, Aave supply approval, 1inch approve flow

### P. Transaction Lifecycle

Every blockchain transaction goes through: submit → pending → confirming → confirmed/failed. Evaluate:

1. Does the button show a loading state during wallet popup?
2. Is there a "Waiting for wallet..." state when the wallet modal is open?
3. After user signs, is there a "Confirming..." state while the tx mines?
4. After confirmation, does the UI update automatically (refetch data)?
5. Is the transaction hash shown or linkable to a block explorer?
6. On failure/revert, is the error message human-readable or raw Solidity error?
7. Is there a tx history or recent activity feed?
8. Does the app handle "user rejected transaction" gracefully (not show an error, just reset)?
9. Compare to: Uniswap swap flow, Aave supply/borrow, OpenSea purchase

### Q. Bridge Flow

Bridging is a standard Web3 operation. Evaluate against production bridge apps:

1. Does the bridge show source chain and destination chain clearly?
2. Is the asset selector clear (which token is being bridged)?
3. Is the estimated time shown?
4. Is the bridge fee displayed?
5. Is there a minimum/maximum amount?
6. Does the bridge show transaction status (pending → bridging → completed)?
7. Is there a bridge history / recent transfers section?
8. If using InterwovenKit's built-in bridge, does the modal integrate cleanly?
9. If the bridge is not functional (testnet limitation), is this clearly communicated instead of silently failing?
10. Compare to: Stargate bridge, Wormhole bridge, Initia Bridge, Orbiter Finance, official L2 bridges (Arbitrum, Optimism)

### R. NFT / Soulbound Token Display

1. Are achievement NFTs displayed with their on-chain metadata (SVG)?
2. Does the token URI resolve and render correctly?
3. Are soulbound tokens marked as non-transferable in the UI?
4. Can users see their NFTs on their profile?
5. Is there a way to view the NFT on a block explorer or NFT marketplace?
6. Does minting an achievement show a celebration / confirmation?
7. Are unearned achievements shown as locked with clear unlock criteria?
8. Is the total count (e.g., "4/12 earned") visible?
9. Compare to: POAP display, Galxe OAT gallery, Soulbound tokens on Layer3, Nouns DAO NFT display

### S. Smart Contract Interaction Patterns

1. Are all contract calls using the correct ABI (matches deployed contract)?
2. Are view calls (reads) separated from write calls (transactions)?
3. Does the app batch multiple reads efficiently (useReadContracts)?
4. Are gas estimates shown before transactions?
5. Does the app handle "out of gas" errors?
6. Is the contract address visible/verifiable somewhere in the app?
7. Does the app link to the contract on a block explorer?
8. Are all amounts displayed with correct decimal formatting (USDC = 6 decimals)?
9. Compare to: Etherscan verified contract interaction, Aave protocol info page

### T. On-Chain Data Freshness

1. Does data refresh automatically after a transaction completes?
2. Is polling/refetch interval appropriate (not too fast, not too slow)?
3. Are stale states visible (e.g., payment status not updating after deposit)?
4. Is there a manual "refresh" option if data seems stale?
5. Does the app show "last updated" timestamps?
6. Compare to: Aave real-time position updates, Uniswap pool data refresh

### U. Security Signals & Trust

1. Are contract addresses displayed somewhere for verification?
2. Is there mention of audits, open source, or security practices?
3. Does the app explain the collateral/penalty system clearly so users trust it?
4. Are approval amounts transparent (not sneaking unlimited approval)?
5. Is there any "Are you sure?" confirmation before large transactions?
6. Does the app explain what happens to funds at each step?
7. Is there a "How it works" or FAQ that addresses trust concerns?
8. Compare to: Aave risk parameters page, Compound security page, bridge safety messaging

---

## How To Evaluate

### Method 1: Visual Inspection (Browser)

Open `http://localhost:3000` using browser tools. Navigate every page, click every button, test every form. Take screenshots of issues.

### Method 2: Code Inspection

Read the source files if needed to understand what a component is supposed to do vs what it actually does.

### Method 3: E2E Scenario

Follow `docs/tests/mvp.md` to test the full happy path if the test environment is running.

---

## Output: HTML Report

Generate a self-contained HTML file at `docs/reports/ux-audit.html` with this structure:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Kitpot UX Audit — Judge & User POV</title>
  <style>/* clean, readable report styling */</style>
</head>
<body>
  <h1>Kitpot UX Audit Report</h1>
  <p>Date: [date] | Evaluator: AI Judge + Public User POV</p>

  <!-- Executive Summary -->
  <section>
    <h2>Executive Summary</h2>
    <p>Overall score, key strengths, critical issues</p>
    <table><!-- Scoring per criteria --></table>
  </section>

  <!-- Per-section findings -->
  <section>
    <h2>[Section Name]</h2>
    <!-- For each finding: -->
    <div class="finding [severity]">
      <h3>[Finding Title]</h3>
      <p><strong>Severity:</strong> Critical / Major / Minor / Suggestion</p>
      <p><strong>POV:</strong> Judge / User / Both</p>
      <p><strong>Description:</strong> What was observed</p>
      <p><strong>Expected:</strong> What a production app would do</p>
      <p><strong>Recommendation:</strong> How to fix</p>
      <p><strong>Reference:</strong> Which production app does this well</p>
      <!-- Optional: screenshot -->
    </div>
  </section>

  <!-- UX Comparison Matrix -->
  <section>
    <h2>UX Comparison Matrix</h2>
    <table>
      <!-- Feature | Kitpot | Venmo | Splitwise | GoFundMe | Verdict -->
    </table>
  </section>

  <!-- Web3 Comparison Matrix -->
  <section>
    <h2>Web3 Flow Comparison Matrix</h2>
    <table>
      <!--
        Pattern               | Kitpot | Aave | Uniswap | Stargate | Verdict
        Token Approval        |        |      |         |          |
        Tx Lifecycle          |        |      |         |          |
        Bridge Flow           |        |      |         |          |
        NFT Display           |        |      |         |          |
        Wallet Connection     |        |      |         |          |
        Chain Switching       |        |      |         |          |
        Error Handling        |        |      |         |          |
        Data Freshness        |        |      |         |          |
        Security Signals      |        |      |         |          |
      -->
    </table>
  </section>

  <!-- Flow Diagram Issues -->
  <section>
    <h2>User Flow Analysis</h2>
    <p>Map of the ideal flow vs actual flow, highlighting:</p>
    <ul>
      <li>Friction points (too many clicks, confusing steps)</li>
      <li>Missing steps (what other apps do that Kitpot skips)</li>
      <li>Unnecessary steps (what Kitpot does that users don't need)</li>
      <li>Web3 friction (approvals, signing, gas) vs abstracted alternatives</li>
    </ul>
  </section>

  <!-- Web3 Flow Audit -->
  <section>
    <h2>Web3 Transaction Flow Audit</h2>
    <p>For each contract interaction in the app, document:</p>
    <table>
      <!--
        Action          | Steps Required | Wallet Popups | User Explanation | Error Handling | Verdict
        Create Circle   |                |               |                  |                |
        Join Circle     |                |               |                  |                |
        Deposit         |                |               |                  |                |
        Advance Cycle   |                |               |                  |                |
        Auto-Pay Setup  |                |               |                  |                |
        Batch Deposit   |                |               |                  |                |
        Claim Collateral|                |               |                  |                |
        Claim Quest     |                |               |                  |                |
        Bridge          |                |               |                  |                |
        Mint Testnet    |                |               |                  |                |
      -->
    </table>
  </section>

  <!-- Final Recommendations (prioritized) -->
  <section>
    <h2>Prioritized Recommendations</h2>
    <p>Grouped by category, ordered by impact within each:</p>
    <h3>Critical (Must Fix)</h3>
    <ol><!-- Numbered --></ol>
    <h3>UX Improvements</h3>
    <ol><!-- Numbered --></ol>
    <h3>Web3 Pattern Fixes</h3>
    <ol><!-- Numbered --></ol>
    <h3>Polish & Nice-to-Have</h3>
    <ol><!-- Numbered --></ol>
  </section>
</body>
</html>
```

### Severity Definitions

| Severity | Meaning |
|----------|---------|
| **Critical** | Blocks the user from completing the core flow. Would cause a judge to stop evaluating. |
| **Major** | Confusing or broken UX that a production app would never ship. Significantly hurts score. |
| **Minor** | Polish issue. User can work around it but it feels unprofessional. |
| **Suggestion** | Nice-to-have improvement. Not a problem, but would elevate the experience. |

---

## Key Comparisons to Make

When evaluating each section, explicitly compare against these apps:

### Consumer / UX References
| App | Why Compare |
|-----|-------------|
| **Venmo / PayPal** | Non-crypto peer payment UX that target users actually know |
| **GoFundMe** | Group fundraising UX familiar to non-crypto users |
| **Splitwise** | Group expense splitting — closest non-crypto analog to ROSCA |
| **Duolingo** | Streak/XP gamification gold standard |

### DeFi / Web3 References
| App | Why Compare |
|-----|-------------|
| **Aave** | Best-in-class DeFi dashboard, approval flow, risk communication, real-time data |
| **Uniswap** | Gold standard for DeFi onboarding, token approval, swap transaction lifecycle |
| **Compound** | Supply/borrow flow with clear transaction states |
| **1inch** | Multi-step approval + swap flow |

### Gamification / Identity References
| App | Why Compare |
|-----|-------------|
| **Rabbithole / Layer3** | XP + quests + badges in crypto done right |
| **Galxe** | OAT/badge system, campaign flow, credential display |
| **POAP** | Event-based NFT badges, gallery display |
| **ENS** | Username system (.eth vs .init) |

### Bridge References
| App | Why Compare |
|-----|-------------|
| **Stargate** | Cross-chain bridge UX, fee display, status tracking |
| **Wormhole Portal** | Bridge flow with chain selector, amount input, status |
| **Orbiter Finance** | Fast bridge with clear source/destination |
| **Official L2 Bridges** | Arbitrum/Optimism bridge — standard deposit/withdraw pattern |

### Direct Competitor
| App | Why Compare |
|-----|-------------|
| **CrediKye** | ROSCA on Creditcoin, Grand Prize winner, gamification reference |

---

## Rules

1. Be brutally honest. This audit exists to find problems BEFORE judges do.
2. Every finding must have a concrete recommendation — no vague "improve this."
3. Evaluate from THREE perspectives simultaneously: (a) non-crypto user, (b) crypto-native user, (c) hackathon judge.
4. If something works but feels like a hackathon prototype, say so. Compare to production.
5. Focus on FLOW, not just individual pages. The journey matters more than any single screen.
6. If the test environment (localhost:3000) is running, use browser tools. If not, audit from code.
7. The HTML report must be self-contained (inline CSS, no external dependencies).
8. Be specific about file paths when recommending code changes.
9. For Web3 patterns: if a flow deviates from how Aave/Uniswap/OpenSea handles it, explain exactly what the standard pattern is and why Kitpot should follow it.
10. For each contract interaction, count the number of wallet popups required and evaluate if any can be eliminated or combined.
11. Check if the app handles ALL transaction states: idle → wallet open → signing → pending → confirming → success/failure. Missing states = Major finding.
12. Bridge and NFT flows are NOT decorative features — they must work like standalone production apps (Stargate, OpenSea) or be clearly marked as "coming soon" with no broken interactions.

---

## Route Map (for navigation)

```
/                          Landing page
/discover                  Browse public circles
/circles                   My circles list
/circles/new               Create new circle
/circles/[id]              Circle dashboard
/circles/[id]/invite       Invite members
/join/[id]                 Join circle from link
/dashboard                 User dashboard (XP, quests, stats)
/leaderboard               Global leaderboard
/achievements              Soulbound NFT badge gallery
/bridge                    Interwoven Bridge + testnet faucet
/u/[address]               Public profile
```
