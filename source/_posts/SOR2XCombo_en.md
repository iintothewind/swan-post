---
title: Streets of Rage SOR2XCombo EN
date: 2026-06-20 19:21:34
tags: [game]
---

# Streets of Rage SOR2XCombo


# Introduction

**SOR2XCombo** is a MOD for **SOR2X**, a side-scrolling beat-'em-up developed by Kratus on the OpenBOR engine.

In the original **SOR2X** project, every playable character has large recovery on most moves, most specials lack sensible recovery cancel routes, and juggle and OTG limits make long combo strings hard to pull off.
To make the game feel more satisfying, I retuned almost every move so each character can build longer combo strings more easily and chain into Level 3 supers more reliably. Of course, buffing the playable cast makes the vanilla bosses feel weak by comparison. Many other SOR2X MODs buff the heroes heavily while leaving bosses unchanged, so enemies—grunts and bosses alike—end up feeling like punching bags. That kind of enemy has no soul. I strengthened the bosses just as much: all bosses can now dodge, block, air tech, parry, and use stronger combo strings; some bosses gained new moves, and so on.

The **SOR2X** project is a free game, and **SOR2XCombo** is free as well. As the author, I have never charged players for this MOD and never will. Every asset in the MOD—images, audio, and so on (except code I wrote myself)—was gathered from the internet. I never owned their copyright. I have no respect for people who sell work built from unauthorized assets.

You may modify **SOR2XCombo** as long as you do not sell my MOD. If anyone sells it, I reserve the right to pursue claims over my modifications to the **SOR2X** project (excluding online asset portions).

# Feedback

- If you enjoy **SOR2XCombo**, join QQ group **657798865** (Chinese community). Latest builds are posted there.
- If you find a bug in **SOR2XCombo**, save **Logs/OpenBorLog.txt**, leave a message in the QQ group, or contact me on Bilibili at [iintothewind](https://space.bilibili.com/29372518) and send the log. I will fix it.


# Features

- Base stat system: Skill, Power, Speed, Jump, and Energy affect core character performance. Power is attack strength, Speed is move speed, Jump is jump height, Energy is meter recovery speed, and Skill affects post-parry invincibility duration and parry meter recovery.
- Parry is easier to use; a successful parry grants brief invincibility and restores meter.
- Rush Heat: after your combo count exceeds 9, you enter invincibility and stay invincible as long as the combo continues.
- Last Chance: when at zero health with a full guard gauge, the next fatal hit restores a small amount of HP.
- Juggle System: caps how many hits an enemy can be juggled; default is unlimited juggle for all enemies. When Juggle value hits zero, air juggle ends.
- OTG System: caps how many times an enemy can be hit on the ground during a combo; default is unlimited OTG. When OTG hits zero, grounded enemies cannot be relaunched.
- Stage 1 (SOR1) routes added; you can pick the SOR1 path at the start fork.
- Every small stage can spawn a random boss, so boss encounters are very frequent.
- All boss attacks are stronger and faster; bosses combo and some can infinite combo.
- Combat pace is much faster; Mania difficulty feels similar to Ninja Gaiden Master Ninja.

# Combat Logic

- **SOR2XCombo** is genuinely harder than vanilla. Many players find it too hard because they do not understand the systems yet.
- **Build meter with normal attacks.** Enemy HP was multiplied, so mashing normals alone does not pay off. I know many players habitually spam normals on bosses—spinning punches and the like—because vanilla bosses fall for it. That does not work here: SOR2XCombo bosses move, attack, and react very fast. Mindlessly mashing normals gets you parried, then comboed for huge damage. Are normals useless? No. Normals do not spend meter; each normal hit restores meter.
	* First, when a boss is juggled in the air, they cannot parry. Feel free to use normals then. **Hold Down on the third normal hit** to change the finisher into a grab: grab the enemy, throw them airborne, then continue with normals. In theory you can loop forever and build meter quickly.
    * Second, push your combo count to **9** as fast as possible and keep it alive to stay in **invincibility**, so you do not worry about enemies behind you.

- **Use parry for invincibility and fast meter recovery.** Parry is a high-reward skill. Many vanilla players never use parry because it required tight timing on two buttons, was very hard, and cost meter—basically useless in vanilla. In SOR2XCombo parry is essential:
	* Low on meter? Parry—it restores a lot.
    * Surrounded? Parry—it grants brief invincibility.
    * Want to beat a boss? Parry—bosses get launched, so parry is often the opener of a combo.

- **Master invincibility tools to make fights easier.** The systems offer many ways to become invincible:
	* Dodging grants invincibility.
	* Parry grants invincibility.
    * Combo count over **9** grants invincibility (Rush Heat).
    * Some characters become invincible during throws.
- **Use dash grabs and air throws often.** Almost every playable character—Max, Blaze, Sammy, etc.—has **Forward+Forward+Energy** as a dash grab: run in, grab a launched enemy, and continue the combo. Max, Blaze, and Shiva also have air specials that are throws; juggle with air normals/specials, then finish with an air throw slam for OTG and keep the loop going.

- **Wall bounce attacks.** Adam and Sammy air specials, SOR2 Shiva and Bison supers, and similar moves launch enemies into the screen edge or wall so they bounce back. Use that to build long, flashy combos.

- **Cancel specials into Level 3 supers mid-combo.** Every playable character has at least one Level 3 super. Vanilla supers are **Down-Forward+Energy**. In SOR2XCombo you can cancel any special with **Down+Special** or **Up+Special** to go straight into a super, or **Tap Energy twice** for a raw super—much easier than vanilla.


# Systems

## How to Enable Cheats

OpenBOR provides unified cheat support. After entering the game, choose:
`Options -> System Options -> Cheats -> On`
Return to the previous menu and Cheats appears under System Options:
- **Infinite Lives** -> On
- **Infinite Credits** -> On
- **Infinite Health** -> On

`Extra Menu -> Game Play -> Energy Regenerate`
- **Energy Regenerate** sets passive MP recovery speed. Off by default; max is 50 MP per second.

Some games disable cheats entirely; those options cannot be turned on. SOR2XCombo allows cheats.

## Multihit Glitch (Hitstun Doubling When Multiple Attackers Hit One Target)

`Options -> System Options -> Multihit Glitch` (PC only)

- Set **Multihit Glitch** to **Off** when multiple hits strike one target. **In solo play or on Mania, always use Off.** If On, getting hit while sandwiched doubles your hitstun and you die fast.

## Controls (PC)

`Options -> Control Options -> Setup Player 1 ...`

- **Up**
- **Down**
- **Left**
- **Right**
- **Attack**
- **Energy** — meter; also used to enter air juggle during combos (short hop)
- **Dodge/Block** — hold to block; press a direction first, then this button to dodge that way
- **Extra** — by default, the launcher finisher of the normal chain. Tap for the last hit of the normal string. Hold Down + Extra for a back attack (useful vs enemies behind you). More often, after wall-bouncing a juggled boss to the screen edge, Down + Extra pulls them back toward center so you can turn around and continue the combo. With a weapon equipped, Down + Extra throws the weapon.
- **Jump** — in the air, hold Up, Down, or neutral and Attack for three different jump attacks. These jump attacks have no recovery; switch between them as fast as you can input to juggle airborne enemies—core air juggle tech, works in vanilla too.
- **Special** — on the ground, tap for a launcher special (Reversal / invincible escape special). Forward + Special is the combo special. In the air, air special; some characters' air specials are throws that slam juggled enemies down.
- **Start** — pause in-game
- **Select** — opens Extra Menu (CPU partners, etc.)

## Controls (Mobile)

`Extra menu -> controls -> Touch Layout`

Left side is the D-pad. Right side:

- **A** — Attack
- **J** — Jump; same three jump attack variants as PC
- **S** — Special; same as PC (Reversal on ground, Forward+Special for combo special, air special in air)
- **A2** — Energy / meter; short hop during combos
- **A3** — Dodge/Block
- **A4** — Extra Button; same as PC Extra
- **Select** — between ESC and Start near the bottom center; opens Extra Menu

## Dojo Practice Mode

`Start Game -> New Game -> Dojo`

- Pick a character to practice
- Dojo Menu
	* `Select Stage` — default Dojo
    * `Select Opponent` — practice boss; default training dummy Kun
    * `Energy Rate` — passive MP recovery; default 0, max 25 MP per second


## Extra Menu

Select **Extra Menu** from the main menu.

### `Extra Menu -> Game Play`

- **Difficult** — default Normal. Options: Normal, Hard, Mania. **Mania** is the highest aggression setting. Changing difficulty auto-applies the preset below (you can still tweak individual options; switching difficulty reapplies the preset).

#### Difficulty Preset Table

| Option | Normal | Hard | Mania |
|------|--------|------|-------|
| Enemy Life Rate | 100% | 100% | 100% |
| Lives | 9 | 9 | 9 |
| Last Chance Recover | 33% | 25% | 20% |
| Counter Attack Reward | 100% | 50% | 25% |
| Rush Heat | 5 | 7 | 9 |
| Juggle System | Unlimited | 40 | 30 |
| OTG System | Unlimited | 6 | 4 |
| Enemy Rush Limit | Unlimited | Unlimited | Unlimited |
| Random Boss | 1 | 1 | 1 |
| Lock MP | On | On | On |
| Energy Regenerate | Never | Never | Never |
| Walls | All Types | All Types | All Types |
| Screen Edge | All Types | All Types | All Types |
| Item Drop | Mixed | Mixed | Mixed |
| Smarter Enemy | Off | Off | On |
| Block Cost | Off | Off | 1 |

- **Enemy Life Rate** — enemy HP cap per new game, 25%–200%
- **Lives** — lives per credit
- **Last Chance Recover** — HP restored by Last Chance when at zero HP with full guard gauge on a lethal hit (%)
- **Counter Attack Reward** — parry reward ratio: MP restored and invincibility duration after a successful parry. 100% default. 0% removes bonus MP and invincibility. 200% doubles both.
- **Rush Heat** — combo count required to enter invincibility; default 9
- **Juggle System** — juggle limit per enemy. Each juggle hit reduces Juggle value; at 0, air juggle ends. Default 40
- **OTG System** — OTG hits allowed per enemy during a combo. Each time a combo hit touches a grounded enemy, OTG decreases by 1; at 0, grounded enemies cannot be relaunched. Default 10
- **Enemy Rush Limit** — max enemy combo length. When a boss exceeds it, they forced dodge/block and break their combo. Default Unlimited
- **Random Boss** — number of random bosses in arcade mode. Default **1**. 0 disables random bosses; values above 1 multiply spawn count
- **Lock MP** — whether MP recovers during multi-hit specials/supers. Default **On** (locked): specials and supers do **not** passively restore MP during their sequences. Off allows MP recovery during those moves
- **Energy Regenerate** — passive MP recovery; off by default
- **Walls** — default All Types; enemies bounce off walls when launched into them
- **Screen Edge** — default All Types; enemies bounce off screen edge when launched into it
- **Item Drop** — Mixed, Food Only, Money Only, Weapon Only, or combinations
- **Smarter Enemy** — smarter AI; reads player inputs. If you hold block, bosses stop mindlessly attacking and try to close in for a grab
- **Block Cost** — guard gauge drain rate while blocking; default 1

### `Extra Menu -> Controls`

- **Block Type** — default Hold (hold block to keep guarding)
- **Run Type** — default SOR2X; optional diagonal (Z-axis) run
- **Dodge Type** — default SOR2X (direction + block). SOR3 allows **Up+Up** / **Down+Down** Z-axis dodges
- **Jump Type** — default SOR2X (no air control after jump). SOR3 allows mid-air steering
- **Extra Button** — default Charge Attack (tap Extra for normal launcher). Back Attack is not recommended
- **Command List** — in-game move list
- **Touch Layout** — mobile button layout

### `Extra Menu -> Feature`

- **Level Select** — after one clear, set On to pick stages on new game

### `Extra Menu -> Partners`

- **Fighting Mode** — Balanced, Aggressive, Defensive
- **Aggression** — aggression level; 9 stars = maximum hate
- **Get Food** — default 50%; partners eat food below 50% HP
- **Follow Caller** — default **Automatic**; leave it
- **Spawn/Kill** — in-game, press **Select** to choose partner, then **A** to summon. Partners share remaining lives; cannot summon at 1 life left. Press A again here to dismiss the active partner

## In-Game HUD

Top of screen shows character portraits and stats. Each playable character has HP, meter, and guard gauge.

- **HP bar** — largest bar under the portrait
- **Guard gauge** — outer frame around the HP bar. Blocking attacks drains it; guard break when empty. Most characters max at 20, recover 5 per second. Green above 50%, red below 50%
- **Meter** — stars under HP. Max 5 stars. Level 3 super costs 3 stars; Reversal costs 1 star. Most characters max MP at 120. MP recovers from hitting enemies, getting hit, parrying, etc.

When attacking enemies, their name and HP appear below, plus:

- **K.O** — enemies killed
- **DMG** — damage in the current combo
- **HIT** — combo count
- **JUG** — remaining juggle value (if Juggle System limit is set)
- **OTG** — remaining OTG hits (if OTG System limit is set)

# Playable Characters

## Base Stats

----

### Overview

|Attribute| Stat | Description |
|-----|---------------|------------------------|
|Skill| Skill | Post-parry invincibility duration and parry MP recovery. At 5 Skill, each successful parry restores up to 25% max MP and grants 5s invincibility. At 1 Skill, up to 5% MP and 1s invincibility.|
|Power| Power | Base attack; bonus to all moves|
|Speed| Speed | Move speed, especially dash speed|
|Jump | Jump | Jump height and speed|
|Energy| Energy | MP recovery speed from hitting or getting hit. At 1 Energy, +1 MP per hit taken or dealt. At 5 Energy, +5 MP|


### Character Stat Table

| Character | Skill | Power | Speed | Jump | Energy | Notes |
| -- | -- | -- | -- | -- | -- | -- |
|Axel |3 | 3 | 3 | 2 | 2 | Well-rounded |
|Blaze |4 | 2 | 4 | 2 | 2 | Technical; weaker than Axel but faster and higher Skill |
|Max |2 | 5 | 2 | 1 | 1 | Grappler; strong throws; slow MP recovery |
|Sammy |4 | 2 | 4 | 3 | 3 | Speed type; low power, fast, good MP recovery |
|Adam |4 | 3 | 3 | 1 | 2 | Similar to Axel; slightly weaker move kit overall |
|Zan |3 | 4 | 2 | 1 | 1 | Power type; wider normals; energy orb specialist |
|SOR2 Shiva |3 | 3 | 4 | 3 | 3 | Boss-style; fast; easy to pick up; second strongest for beginners; needs execution |
|SOR3 Shiva |3 | 3 | 5 | 3 | 2 | Boss-style; fastest; strongest for beginners |
|SOR2 Electra |3 | 2 | 5 | 2 | 1 | Boss-style; fast; wide super; beginner-friendly |
|Bison |2 | 5 | 2 | 1 | 1 | Power type; heaviest hit feel |
|Chunli |3 | 2 | 4 | 5 | 1 | Speed type; low power; excels at air juggle |
|Kage |5 | 2 | 5 | 5 | 1 | Technical; low HP/power; highest parry reward; stylish but demanding |
|Lee Rekka |3 | 2 | 4 | 3 | 2 | Balanced; many fire-element moves|

------

## Universal Skills

| Input | Move | Follow-ups |
|:---|:---|:---|
|Hold **Block** | **Block** — attacks drain guard gauge; guard break when empty | At block impact, press Forward or Back for parry |
|Parry | While blocking, press **Forward** at enemy hit timing | Enemy enters hitstun; auto counter; brief invincibility and large MP restore. Duration/amount scales with Skill |
|Direction + **Block** | **Dodge** that direction; brief invincibility; costs ¼ guard gauge | If Dodge Type is SOR3, Up+Up / Down+Down for Z-axis dodge |
|While launched, **Up+Jump** | **Air recovery / air tech** — costs ¼ guard gauge | Enemies attack fast; without air tech you eat long air juggles |
|While down, **Up+Attack** | Wake-up attack | Quick rise and strike. Many bosses use this—block or parry. Some wake-ups are grabs; blocking gets you grabbed |
|**Extra** | Heavy attack / normal chain finisher; strong launcher; costs ½ guard gauge | Hold **Forward or Back** + Extra to adjust spacing; links to many specials or Level 3 supers |
|**Up+Extra** | Some characters: anti-air or spacing tool; costs partial guard gauge | Great in ground combos for fast meter build |
|**Down+Extra** | Back attack; costs ½ guard gauge | On screen-edge juggles, pulls enemy back to center; short recovery; links after |
|**Tap Energy repeatedly during combo** | **Short hop** into jump attacks | Short recovery, no MP cost; core long combo tool |
|Sandwiched, press **Special** | **Reversal / invincible escape special** — hits front and back; costs 1 star | Use when surrounded or in hitstun |
|**Down+Special during combo** | First Level 3 super (2+ stars) | Also **Down-Forward+Energy** or **Tap Energy twice** |
|**Up+Special during combo** | Second Level 3 super (2+ stars) | |
|**Tap Energy twice** | Raw first Level 3 super without combo cancel | |
|Air **Attack** | Neutral jump attack | **Tap Energy quickly** for short hop juggle switches; **Special** for air special finisher |
|Air **Forward+Attack** | Forward air attack (often flying kick); can launch | Same short hop / air special options |
|Air **Down+Attack** | Down air attack; on hit, fast grab into ground throw | Costs a little MP; drains meter if below cost |
|Air **Up+Attack** | Up air attack; launches diagonally upward | Same short hop / air special options |
|Wall bounce jump | At wall or screen edge, **Jump** opposite direction | Some characters bounce off edge toward center; higher jump or evade |
|Throw escape | Enemy grab startup, press **Attack** | Costs ⅔ guard gauge; some characters counter-throw, others backdash |
|Weapon **Down+Extra** | Throw weapon; some weapons multi-throw | Infinite throw bug = script issue |
|Passive | Last Chance — requires empty guard gauge | At zero HP with full guard gauge, lethal hit restores some HP |
|Passive | Rush Heat | Combo count over 9 = invincibility while combo continues |
|Passive | Super Armor — costs ½ guard gauge | Max, Sammy, Zan, etc.: with full guard gauge, auto-blocks one hit |
|Passive | Taunt | Some characters (SOR2 Electra, Bison, Lee Rekka): stand still to taunt; restores some HP or meter |


## Axel

- Balanced attack, speed, skill, and MP recovery.
- Fast normals; strike-focused kit. Special is rapid punches (ground and air)—beginner friendly. Downside: canceling specials into Level 3 super often pulls enemies to the ground, letting some enemies teleport-dodge mid-combo and drop the string.

| Input | Move | Follow-ups |
|:---|:---|:---|
|Tap **Attack** | Normal 1-2-1-2-3 chain; 4th hit is double side kick | Hold Down on 3rd hit for grab on 4th |
|**Extra**| Heavy: double side kick; Forward/Back adjusts spacing | **Forward+Forward+Attack** uppercut, **Forward+Forward+Energy** dragon punch, **Down+Special** Level 3 Spinning Dragon Punch, **Up+Special** Level 3 Phantom Lion Punch, **Tap Energy quickly** short hop air juggle |
|**Up+Extra**| Dragon punch; costs stamina | Air **Forward+Special** air flurry, **Tap Energy quickly** short hop juggle |
|**Forward+Forward+Attack**| Uppercut; last hit launches; no MP cost | **Extra** double kick, **Down+Special** Spinning Dragon Punch, **Up+Special** Phantom Lion Punch, **Tap Energy quickly** air juggle |
|**Forward+Forward+Energy**| Dragon punch; 2 spins then uppercut; launches; fire damage; small MP cost | On ground, same as F+F+Attack. In air: **Special** air flurry (small MP), air **Up+Special** air dragon punch, or **Tap Energy quickly** short hop jump attack switches |
|**Special**| 360 Flame Punch Reversal; invincible startup; launches on hit | Short recovery; links after |
|**Forward+Special**| Ground flurry into dragon punch | Mash **Attack** during flurry to spend guard gauge for extra hits and faster star recovery. **Forward+Forward+Attack**, **Forward+Forward+Energy**. With 3+ stars during flurry: **Down+Special** / **Up+Special** Level 3s, **Tap Energy quickly** short hop juggle |
|**Down+Special in combo**| Level 3 Spinning Dragon Punch; seals enemy specials; full sequence adds fire | Also **Down-Forward+Energy** or **Tap Energy twice**; best after special cancel. On Mania, if enemy can teleport-dodge and previous hit left them grounded, late cancel when they are airborne improves hit rate |
|**Up+Special in combo**| Level 3 Phantom Lion Punch; huge half-screen hitbox | Special cancel only; no teleport-dodge issue; may whiff at screen edge or vs obstacles |
|Hold **Forward**, grab **Attack**| Knee; 2 knees then launch | Short recovery |
|Grab **Attack**| Headbutt launch | Short recovery |
|Grab **Back+Attack**| Suplex backward | Short recovery |
|Grab **Jump**| Flip jump over enemy; brief invincibility | Continue throw routes |
|After flip jump **Attack**| Flip throw slam | Short recovery |
|Air **Special**| Air flurry | Air **Up+Special** air dragon punch; best after short hop juggle as air finisher |
|Parry| Forward at impact: dragon punch, fire | In air: **Special** air flurry or **Tap Energy quickly** jump attack switches |
|Dagger **Attack**| Dagger chain; no launch; sustained hits | Drop weapon when hit; despawns after 30s on ground |
|Kunai **Attack**| Kunai chain; same rules | 30s despawn |
|Pipe **Attack**| Launching hits | 45s despawn |
|Sword **Attack**| Launching hits | 60s despawn |
|Sword **Forward+Forward+Attack**| Phantom Sword wide slash; no MP | No cancel; last hit launches |
|Sword **Attack** then **Down+Attack**| Sword beam; costs 3 stars | Beam cannot be blocked |


## Blaze

- Similar balance to Axel; slightly lower power, slightly higher speed.
- Technical; fast normals, weaker raw hits, but ground dash grab + air throw make combos more varied.
- Level 3 Chidori actually costs 2 stars, not 3—exploit that for longer routes.
- With dagger: walking/running and dagger Upper / dagger frenzy are invincible during startup/active.
- Can spend guard gauge to throw grenades for wide damage.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2-3; 4th high-angle front kick | Hold Down on 3rd for grab |
|**Extra**| Heavy: 4th kick; spacing with Forward/Back | **Down+Special** Level 3 Chidori, **Tap Energy quickly** short hop juggle |
|Ground **Up+Extra**| Grenade toss; partial guard cost | On hit, strong launch; on miss, timed explosion |
|**Forward+Forward+Attack**| 360 flip into knife hand | In air: short hop juggle, **Special** air throw slam |
|**Forward+Forward+Energy**| Dash grab; not invincible during dash; grab breaks guard; anti-air | End combos on launched enemies to re-grab |
|**Special**| Backflip blade kick Reversal; invincible; launches | **Forward+Forward+Attack**, **Forward+Forward+Energy**, **Extra**, **Down+Special** Chidori, short hop juggle |
|**Forward+Special**| Hadoken-style flurry; last hit OTG bounce; small MP | Same links; with 3+ stars **Down+Special** Chidori, short hop |
|**Down+Special in combo**| Level 3 Chidori; 2 stars; seals specials; lightning damage full route | Special cancel recommended. Mania teleport-dodge note: delay cancel until **Forward+Special** last hit launches boss |
|**Up+Special in combo**| Level 3 Hadoken Flash; 3 stars | Rapid hadoken hits; flash finisher |
|Hold **Forward**, grab mash **Attack**| Knees x2 then slap | Hold Forward to re-grab loop on grunts only; not invincible; bosses break early |
|Grab **Attack**| Knockdown OTG bounce | **Forward/Back+Extra** relaunch from OTG, **Forward+Forward+Attack**, **Forward+Forward+Energy** |
|Grab **Back+Attack**| Suplex | Short recovery |
|Grab **Jump**| Flip jump; brief invincibility | More throws |
|After flip **Attack**| Flip throw slam | Short recovery |
|Air **Down+Attack**| Air down; on hit, fast grab into suplex | OTG bounce; continue juggle |
|Air **Special**| Air throw; OTG bounce | Finisher after short hop juggle |
|Parry| Slide; anti-air | **Forward/Back+Extra** OTG relaunch, **Forward+Forward+Attack**, **Forward+Forward+Energy** |
|Dagger **Attack**| Dagger chain | 30s despawn |
|Dagger **Forward+Forward+Attack**| Dagger upper; invincible during move | Before leaving ground, link **Down+Special** dagger frenzy |
|Dagger **Forward+Special**| Dagger frenzy; invincible | **Down+Special** dagger frenzy super |
|First two hits **Down+Special**| Dagger frenzy super; low MP | Mash **Attack**: guard then MP for extra hits |
|Kunai **Attack**| Kunai chain | 30s |
|Pipe **Attack**| Launch | 45s |
|Sword **Attack**| Launch | 60s |
|Sword **Forward+Forward+Attack**| Phantom Sword | Last hit launches |


## Max

- Grappler; slow move and attack speed; Power 5 (highest among heroes).
- High HP + Super Armor = solid defense.
- Rich throw kit; not long juggle focused but air throw + ground throw synergy looks great.
- Invincible briefly after grabs and air throw.
- Three Level 3 supers: **Down+Special** Arm Shock; during grab headbutt **Up+Special** Sit Slam; **Down+Special** Bridge Throw.
- Combos rely on **Extra** double fist slam, **Tap Energy quickly** short hop juggle, air **Special** air throw on floated enemies.
- Slow MP recovery. With no meter, **Hold Down + mash Attack** into throw loop to build 3 stars, then **Up+Special** Sit Slam or **Down+Special** Bridge Throw.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2-3; 4th double fist slam | Down on 3rd for grab |
|**Extra**| Heavy slam; spacing | **Down+Special** Level 3, short hop juggle |
|**Forward+Forward+Attack**| Slide | Short hop face kick juggle, **Special** spin punch, **Forward+Special** shoulder rush |
|**Forward+Forward+Energy**| Dash grab | Re-grab launched enemies |
|**Special**| Spin punch Reversal; invincible; launches | Slide, dash grab, **Extra**, **Forward+Special**, short hop |
|**Forward+Special**| Shoulder rush multi-hit; last hit OTG; small MP | Dash grab, **Extra**, **Special** short hop air grab, short hop juggle |
|**Down+Special in combo**| Level 3 Arm Shock; launches; wall bounce | **Down-Forward+Energy** or **Tap Energy twice**; special cancel |
|Hold **Forward**, grab mash **Attack**| Knees x2 then headbutt | Knees can **Jump** to air grab state |
|Grab **Attack**| Neck lock headbutt | **Hold Down + Attack** x3 into throw for infinite loop on grunts; headbutt **Up+Special** Sit Slam or **Down+Special** Bridge Throw |
|Headbutt **Up+Special**| Level 3 Sit Slam | Strong throw; enemy floats after |
|Headbutt **Down+Special**| Level 3 Bridge Throw | Strong throw; enemy floats after |
|Grab **Back+Attack**| Suplex | Short recovery |
|Grab **Jump**| Air carry | **Special** air sit slam, **Forward+Special** ground slam |
|Air **Down+Attack**| Air down; usually fast grab on fall | Continue throws |
|Air near floated enemy **Special**| Air sit slam | Slam with brief invincibility; finisher after short hop |
|Parry| Spin punch; anti-air | Slide, dash grab, **Extra**, **Forward+Special**, short hop |
|Dagger **Attack**| Dagger chain | 30s |
|Kunai **Attack**| Kunai chain | 30s |
|Pipe **Attack**| Launch | 45s |
|Pipe chain **Down+Special**| Level 3 pipe smash | Hard knockdown |
|Sword **Attack**| Launch | 60s |


## Sammy

- Shortest reach on the team but very agile. Energy 3 = rarely starved; supers often. Power 2 like Blaze.
- Low HP but Super Armor.
- Invincible after grabs and flip jump; invincible during mounted rapid punches on enemy's head after flip.
- Only vanilla character who could raw air Level 3 super; still true here.
- Most weapon routes: **Forward+Forward+Attack** cyclone slash; cyclone into **Down+Special** Super Cyclone. Pipe **Forward+Special** = pipe ground spin.
- Empty-hand: air **Special** backflip kick wall-bounces for rich juggles.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2-3; 4th backflip kick | Down on 3rd for grab |
|**Extra**| Heavy backflip kick | **Down+Special** Level 3 Air Drill, short hop juggle |
|**Forward+Forward+Attack**| Front flip headbutt | Air: short hop flying kick, **Special** backflip wall bounce kick, **Extra** |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Ground sweep Reversal; invincible; launches | Short hop juggle |
|**Forward+Special**| Rapid punches into backflip kick; Forward/Back spacing | Mash **Attack** for extra hits (MP). Short hop kick, **Special** wall bounce, **Extra**, **Down+Special** Air Drill ground or air |
|**Down+Special in combo**| Level 3 Air Drill; ground or air | **Down-Forward+Energy** or **Tap Energy twice**; avoid raw ground (long startup). Best: special cancel in air, or **Down+Special** before backflip kick on grabbed enemy |
|Hold **Forward**, grab mash **Attack**| Headbutt x2 then backflip kick | Headbutts into **Jump** over head; **Down+Special** Ground Drill before launch |
|Grab **Attack**| Mounted rapid punches; brief invincibility | Mash **Attack** (guard cost) for extra hits + star recovery. Whole move invincible |
|Grab **Back+Attack**| Backflip kick launch | Short recovery |
|Grab **Jump**| Flip jump; invincibility | Throws |
|During flip **Attack**| Flip throw forward | |
|After flip **Attack**| Mount neck, rapid head punches; invincible | Whole route invincible |
|Air **Down+Attack**| Fast grab fall | Throws |
|Air **Forward+Special**| Backflip power kick wall bounce | Continue juggle; air tech enemies may not bounce |
|Parry| Backflip kick into crescent wave; anti-air | **Forward+Forward+Attack**, dash grab, **Extra**, **Forward+Special**, short hop |
|Dagger **Attack**| Dagger chain | 30s |
|Dagger **Forward+Forward+Attack**| Dagger cyclone | **Down+Special** Super Cyclone |
|Kunai **Attack**| Kunai chain | 30s |
|Kunai **Forward+Forward+Attack**| Kunai dash | **Down+Special** Super Cyclone |
|Pipe **Attack**| Launch | 45s |
|Pipe **Forward+Forward+Attack**| Pipe cyclone | **Down+Special** Super Cyclone |
|Pipe **Forward+Special**| Pipe ground spin | Mash **Attack** for extra hits |
|Sword **Attack**| Launch | 60s |
|Sword **Forward+Forward+Attack**| Katana cyclone | **Down+Special** Super Cyclone |
|Weapon cyclone **Down+Special**| Level 3 Super Cyclone | Last hit launches |


## Adam

- SOR2X hidden unlock (second playthrough). Energy 1, Jump 1; power like Blaze/Sammy; Skill 4. Relies on parry for meter. Higher HP than Sammy—technical but forgiving.
- Signature: **Forward+Forward+Energy** crescent wave; air **Special** Superman punch wall bounce.
- Two Level 3s: **Down+Special** Flurry super; **Up+Special** Triple Smash.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2-3; 4th side kick | Down on 3rd for grab |
|**Extra**| Heavy side kick | **Down+Special** Flurry super, **Up+Special** Triple Smash, short hop |
|**Forward+Forward+Attack**| Uppercut; launches | Short hop kick, **Extra** |
|**Forward+Forward+Energy**| **Signature** uppercut into crescent wave | Use at range to launch then close in |
|**Special**| 360 hook Reversal; invincible; launches | Short hop |
|**Forward+Special**| Rapid side kicks | Mash **Attack** (guard) for extra hits + star recovery |
|**Down+Special in combo**| Level 3 Flurry; ground or air | **Down-Forward+Energy** or **Tap Energy twice**; last hit launches |
|**Up+Special in combo**| Level 3 Triple Smash + Superman punch | Same raw input; last hit launches |
|Hold **Forward**, grab mash **Attack**| Knees x2 then head OTG | Knees into **Jump** over head |
|Grab **Attack**| Repeated knees; last hit launches | Hold **Down** and mash **Attack** 1-1-2-3 after launch |
|Grab **Back+Attack**| Over-shoulder throw | Short recovery |
|Grab **Jump**| Flip jump | Throws |
|After flip **Attack**| Suplex back | Short recovery |
|Air **Down+Attack**| Fast grab into suplex | Continue combo |
|Air **Special**| **Signature** Superman punch wall bounce | Air juggle finisher; air tech may deny bounce |
|Parry| Side kick; anti-air | **Forward+Forward+Attack**, crescent wave, **Extra**, **Forward+Special**, short hop |
|Dagger **Attack**| Dagger chain | 30s |
|Kunai **Attack**| Kunai chain | 30s |
|Pipe **Attack**| Launch | 45s |
|Sword **Attack**| Launch | 60s |
|Sword **Forward+Forward+Attack**| Katana dash multi-hit; last hit launches | **Down+Special** katana Level 3 |
|Sword **Down+Special in combo**| Level 3 katana dash; Forward/Back adjust | Mash **Attack**: guard then MP for extra hits |


## Zan

- SOR2X hidden unlock; robot old man; electric attacks. Energy 1, Jump 1; Power 4. Power-technical hybrid.
- Signature weapon super: **Down-Forward+Special** homing energy orb—longest, highest damage super in the roster, also the most boring (orb locks enemy until it expires).
- Orbs also from **Forward+Special** (star cost) or **Down+Extra** (weapon throw count). Semi-homing forward; explodes on contact.
- Discharge specials: **Special** full body, **Forward+Special** electric claw, air **Special** air claw—all combo tools.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2; 3rd straight punch | Down on 2nd for grab |
|**Extra**| Heavy straight punch | **Down+Special** Level 3 orb volley, short hop |
|**Forward+Forward+Attack**| Shoulder rush; launches | Short hop, **Extra** |
|**Forward+Forward+Energy**| Extend arm grab; breaks guard; anti-air | Re-grab floated/downed enemies |
|**Special**| Full discharge Reversal; invincible; launches | Short hop |
|**Forward+Special**| Electric claw; launches; mash **Attack** (guard) for extra hits | **Down+Special** orb volley, short hop |
|**Down+Special in combo**| Level 3 orb volley | **Down-Forward+Energy** or **Tap Energy twice**; best after **Forward+Special** or **Extra** (range + pin) |
|Hold **Forward**, grab mash **Attack**| Claw x2 then heavy punch | Re-grab loop on grunts only |
|Grab **Attack**| Slam OTG | Short recovery |
|Grab **Back+Attack**| Back throw | Short recovery |
|Grab **Jump**| Flip jump | Throws |
|After flip **Attack**| Back throw | Short recovery |
|Air **Down+Attack**| Fast grab fall | Throws |
|Air **Special**| **Signature** air electric claw | Air juggle finisher; electric hits deny air tech |
|Parry| Shoulder rush; anti-air | **Forward+Forward+Attack**, dash grab, **Extra**, **Forward+Special**, short hop |
|Weapon **Forward+Special**| Orb (star cost) | Small blast; weak aim |
|Weapon **Down+Extra**| Orb (throw count) | Same |
|Weapon **Down-Forward+Special**| **Tap Energy twice** homing orb | Locked hitstun until orb ends; use two if one does not kill |


## SOR2 Shiva

- SOR2XCombo hidden hero; mostly 3s, Speed 4. Needs fast inputs—strongest juggler in the roster. Hadoken loops refill meter for repeated supers in one juggle.
- Signature: **Forward+Forward+Attack** hadoken wall bounce; big MP on hit.
- Air **Forward+Special** dragon tail kick; **Down+Special** Level 3 dragon tail kick. With hadoken = flashy wall juggles.
- Large startup—relies on **Forward+Forward+Energy** dash grab to close on floated enemies before specials.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2; 3rd high kick | Down on 2nd for grab |
|**Extra**| Heavy high kick | **Forward+Forward+Attack** hadoken, **Forward+Special** dragon tail, **Down+Special** / **Up+Special** Level 3s, short hop |
|**Down+Extra**| Flip kick; fire launch; air flip on hit | **Before flip**: hadoken, dragon tail, Level 3s, short hop, **Extra** |
|**Forward+Forward+Attack**| **Signature** hadoken wall bounce; **big MP on hit** | Short hop, **Extra**, **Up+Special** Phantom Palm |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Reverse kick Reversal; invincible; launches | Short hop, hadoken, **Extra** |
|**Forward+Special**| Dragon tail kick; fire on last hit | **Up+Special** air grab, **Down+Special** Level 3 dragon tail, short hop |
|**Up+Special in combo**| Level 3 Phantom Palm; huge range; **big MP on hit** | Last hit launches |
|**Down+Special in combo**| Level 3 dragon tail kick; wall bounce | **Down-Forward+Energy** or **Tap Energy twice**; best after **Forward+Special** or **Down+Extra** launch |
|Hold **Forward**, grab mash **Attack**| Hook combo; brief invincibility | Re-grab loop |
|Grab **Attack**| Normal 3rd high kick | Short recovery |
|Grab **Back+Attack**| Back slam OTG | Best after dash grab to relaunch |
|Grab **Jump**| Flip jump | Throws |
|After flip **Attack**| Slam OTG | Short recovery |
|Air **Down+Attack**| Grab slam OTG | Continue combo |
|Air **Special**| Air grab slam | Finisher; dragon tail is stronger for juggles |
|Parry| Reverse kick | Hadoken, dash grab, **Up+Special**, **Extra**, short hop |


## SOR3 Shiva

- Strongest playable in SOR2XCombo.
- Signature **Forward+Forward+Attack** Phantom Palm—free, huge range, big MP on hit.
- **Forward+Special** Dragon Claw flurry; **Down+Special** Level 3 Dragon Claw flurry (even longer).
- All three link seamlessly—infinite loops are easy.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2; 3rd high kick | Down on 2nd for grab |
|**Extra**| Heavy high kick | **Forward+Forward+Attack** Phantom Palm, **Forward+Special** Dragon Claw, **Down+Special** Level 3 Dragon Claw, short hop |
|**Down+Extra**| Flip kick; fire; air flip on hit | **Before flip**: Phantom Palm, Dragon Claw, Level 3, short hop, **Extra** |
|**Forward+Forward+Attack**| **Signature** Phantom Palm; free; huge; **big MP** | Last hit launches |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Reverse kick Reversal | Short hop, Phantom Palm, **Extra** |
|**Forward+Special**| Dragon Claw flurry; fire launch; low MP, many hits; short range, long startup | Teleport-dodge bosses: **Forward+Forward+Energy** grab first (grabbed enemies cannot teleport). Then **Down+Special** Level 3, short hop, **Extra** |
|**Down+Special in combo**| Level 3 Dragon Claw | Raw whiffs—use after **Forward+Special** or dash grab |
|Hold **Forward**, grab mash **Attack**| Hook combo; brief invincibility | Re-grab loop |
|Grab **Attack**| 3rd high kick | Short recovery |
|Grab **Back+Attack**| Back slam OTG | After dash grab |
|Grab **Jump**| Flip jump | Throws |
|After flip **Attack**| Slam OTG | Short recovery |
|Air **Down+Attack**| Grab slam OTG | Continue |
|Air **Special**| Air grab slam | Juggle finisher |
|Parry| Hadoken wall bounce | Phantom Palm, dash grab, **Extra**, short hop |


## SOR2 Electra

- SOR2XCombo original hero; Speed 4, Skill 4—very fast technical fighter.
- Signature: electric whip shot pins enemies; Level 3 closes in for wide whip flurry.
- Whip grab pull: **Up+Extra** pulls enemy in for throws.
- Very fast dash grab; has healing grab (18+ style).
- Taunt standing still restores full meter bar.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2; 3rd high kick | Down on 2nd for grab |
|**Extra**| Heavy high kick | **Forward+Forward+Attack** rising whip, **Forward+Special** whip shot, **Down+Special** Level 3 whip flurry, short hop |
|**Down+Extra**| Back kick | Pull screen-edge juggles to center |
|**Up+Extra**| Whip grab pull | Links to throws |
|**Forward+Forward+Attack**| Rising whip | **Forward+Special**, **Down+Special**, short hop |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Electric whip 360 Reversal | Short hop, rising whip, **Extra** |
|Ground **Up+Special**| Anti-air rocket; 1 star | Strong launch |
|Ground **Down+Special**| Pull air enemy down; guard cost | Throws after |
|**Forward+Special**| Whip shot pin; last hit launches | Long range vs floats; **Down+Special** Level 3, rising whip, **Extra** |
|**Down+Special in combo**| Level 3 whip flurry: shot pin then rush flurry | After **Forward+Special** |
|Hold **Forward**, grab mash **Attack**| Knee flurry; not invincible | **Down+Special** |
|Grab **Attack**| Whip flurry; not invincible | Mash **Attack** (guard); **Down+Special** |
|Grab **Back+Attack**| Turn knee; launches | |
|Grab **Up+Attack**| 18+ grab; heals small HP | Long recovery; no follow-up |
|Air **Down+Attack**| Fast grab fall | Throws |
|Air **Special**| Air rising whip | Juggle finisher |
|Parry| Rising whip wall bounce | **Forward+Forward+Attack**, dash grab, **Extra**, short hop |



## Bison (SF2)

- SOR2XCombo original; Power 5, Jump 1, Energy 1—power brawler.
- Very slow MP recovery; heavy normals; high parry damage; normal + special combo focus.
- Taunt restores some HP.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-2-3-4; 4th uppercut | Down on 3rd for grab |
|**Extra**| Heavy uppercut | **Forward+Forward+Attack** drop punch, **Forward+Special** combo flurry, **Down+Special** Level 3 Flurry, **Up+Extra** or **Up+Special** headbutt dive, short hop |
|**Down+Extra**| Low sweep | Pull edge juggles to center |
|**Up+Extra**| Dive headbutt anti-air | Air **Special** headbutt, **Extra** |
|**Forward+Forward+Attack**| Drop punch | **Forward+Special**, **Down+Special**, dive headbutt, short hop |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Straight punch 360 Reversal | Short hop, drop punch, **Extra** |
|**Forward+Special**| Combo flurry pin; launches | Mash **Attack** (guard); **Down+Special**, dive headbutt, drop punch, **Extra** |
|**Up+Special**| Dive headbutt anti-air | Air **Special** headbutt, **Extra** |
|**Down+Special in combo**| Level 3 Flurry; **wall bounce** finisher | **Down-Forward+Energy** or **Tap Energy twice** |
|Hold **Forward**, grab mash **Attack**| Gut punch; not invincible | Re-grab loop on grunts |
|Grab **Jump**| Jump carry | **Attack** air headbutt = air **Special** |
|Grab **Attack**| Headbutt; invincible | Short recovery |
|Grab **Back+Attack**| Turn headbutt; invincible | Short recovery |
|Air **Down+Attack**| Fast grab fall | Throws |
|Air **Special**| Air headbutt throw | Juggle finisher |
|Parry| Drop punch | Drop punch, dash grab, **Extra**, short hop |


## Chunli (SF2)

- SOR2XCombo original; Speed 4, Jump 5—fast air juggle specialist.
- Power 2—needs long strings for damage.
- Signature: Hyakuretsukyaku (**Forward+Special**) ground and air; air **Down+Attack** air stomp chain.
- Recommended super route: ground Hyakuretsukyaku or **Forward+Extra** heavy into Level 3.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-2-3-4; 4th double side kick | Down on 3rd for grab |
|**Extra**| Heavy double kick | **Forward+Forward+Attack** triple rising kick, **Forward+Special** Hyakuretsukyaku, **Down+Special** / **Up+Special** Level 3s, short hop |
|**Down+Extra**| Back kick | Edge juggle pull |
|**Up+Extra**| Hadoken; 3 slow waves; ¼ guard | |
|**Forward+Forward+Attack**| Triple rising kick | Air **Forward+Special** air Hyakuretsukyaku, air **Down+Special** air throw, **Up+Special** flip kick, short hop |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Inverted spin kick Reversal | Short hop, triple kick, **Extra** |
|Ground **Forward+Special**| Hyakuretsukyaku pin; launches | Mash **Attack** (guard); **Down+Special**, **Up+Special** Kikoken, triple kick, **Extra**, flip kick, short hop |
|Air **Forward+Special**| Air Hyakuretsukyaku | **Up+Special** flip kick, short hop, air **Down+Attack** stomp |
|**Down+Special in combo**| Level 3 Flurry; Hyakuretsukyaku ender | **Down-Forward+Energy** or **Tap Energy twice** |
|**Up+Special in combo**| Level 3 Kikoken; huge range | Last hit launches |
|Grab **Jump**| Skull crush knee over head | **Attack** before knee = throw forward |
|Grab **Attack**| Flip kick launch | Short hop after |
|Grab **Forward+Attack**| Forward throw OTG | Short recovery |
|Grab **Back+Attack**| Back throw OTG | Short recovery |
|Air **Down+Attack**| Air stomp; stay airborne on hit | After short hop when above enemy |
|Air **Down+Special**| Air throw slam | Juggle finisher |
|Parry| Handstand side kick | Triple kick, **Extra**, short hop, **Down+Special**, **Up+Special** |


## Kagetsura (Sengoku3)

- SOR2XCombo original; Skill 5, Speed 5, Jump 5—speed and parry specialist.
- Energy 1 but fast movement/attacks keep meter flowing. Power 2—needs parry or long combos.
- Signature: Comet Slash ground (**Forward+Special**); Iga Drop (grab **Up+Attack** or air **Down+Special**); Reversal Wood Bomb—press Forward/Back during explosion to teleport.
- Flying Thunder God ground (**Up+Extra** or **Up+Special**)—on hit, grab into throws.
- Super route: **Extra**, Comet Slash, or **Forward+Forward+Attack** double kick into Level 3.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-1-2-3-4; 5th downward slash | Down on 4th for grab |
|**Extra**| Heavy downward slash | **Forward+Forward+Attack** double kick, **Forward+Special** Comet Slash, **Down+Special** Level 3, short hop |
|**Up+Extra**| Flying Thunder God kunai; guard cost; only from neutral | Line shot; on hit, grab |
|**Down+Extra**| Spin kick | Back attack; edge juggle pull |
|**Forward+Forward+Attack**| Double kick | **Forward+Special**, **Down+Special**, short hop |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Wood Bomb Reversal; invincible; launch | Forward/Back during blast = teleport |
|Ground **Forward+Special**| Comet Slash pin; launches | **Down+Special**, double kick, **Extra**, short hop |
|Ground **Up+Special**| Homing Flying Thunder God; guard; neutral only | Tracks off-axis; grab on hit |
|Air **Forward+Special**| Air spin kick; wall bounce | Continue after bounce |
|Air **Down+Special**| Air Iga Drop | OTG continue |
|**Down+Special in combo**| Level 3 Flurry flash finish | **Down-Forward+Energy** or **Tap Energy twice** |
|**Up+Special in combo**| Level 3 flash multi-slash; moderate damage (low Power) | Last hit launches |
|Grab **Attack**| Air spin kick; launches | Short hop or air **Down+Special** Iga Drop |
|Grab **Down+Attack**| Swallow Flash rapid draw | Mash **Attack** (guard); launches |
|Grab **Forward+Attack**| Forward throw OTG | Short recovery |
|Grab **Back+Attack**| Back throw OTG | Short recovery |
|Grab **Jump**| Air carry | **Attack** Iga Drop = air **Special** |
|Air **Down+Attack**| Fast land; land **Attack** = air spin kick | Keeps grab state on land |
|Air **Up+Attack**| Fast land; land **Up+Attack** = Iga Drop | Keeps grab state |
|Parry| Draw slash | Double kick, **Extra**, short hop, **Down+Special** |


## Rikka Lee (Last Blade)

- SOR2XCombo original; average stats but many fire hits deny enemy recovery—still strong.
- Signature: **Shadowless Kick** (grab **Down+Attack**); **Dragon Hammer Spin** (**Forward+Special**, then **Down+Special** x3); **Dragon Upper** (**Up+Special** in combo or **Up+Extra**).
- **Shadowless Kick** multi-hit = fast MP recovery.
- **Dragon Hammer Spin** can air chase 3 times (scaling damage) + **Dragon Upper**—can outdamage Level 3 super if full route hits.
- Taunt lion dance restores full HP and meter.

| Input | Move | Follow-ups |
|:---|:---|:---|
|**Tap Attack**| Normal 1-2-3-4-5; 5th combo kick | Down on 4th for grab |
|**Extra**| Heavy combo kick | **Forward+Special** Dragon Cannon, **Up+Extra** upper, **Forward+Forward+Attack** fan strike, **Forward+Special** Dragon Hammer Spin, **Down+Special** Level 3, short hop |
|**Up+Extra**| Dragon upper launch | Air **Down+Attack** slam; land **Down+Attack** Shadowless Kick |
|**Down+Extra**| Turn fan strike | Back hit; edge pull |
|**Forward+Forward+Attack**| Fan strike | **Forward+Special** Dragon Cannon, **Down+Special**, **Up+Special** Flame Dragon flash, **Up+Extra**, short hop |
|**Forward+Forward+Energy**| Dash grab | Re-grab |
|**Special**| Fan strike Reversal | Multi-hit launch |
|Ground **Forward+Special**| Dragon Hammer Spin; launches | Air **Down+Special** up to 3 chases (scaling); **Up+Special** Dragon Upper |
|Air **Down+Special**| Air Dragon Hammer Spin; +2 chases | **Up+Special** Dragon Upper |
|**Down+Special in combo**| Level 3 Flurry flash finish | **Down-Forward+Energy** or **Tap Energy twice** |
|**Up+Special in combo**| Level 3 Flame Dragon pillar flash | Scaling hits |
|Grab **Attack**| Fan strike | Short hop after launch |
|Grab **Forward+Attack**| Forward inch punch | Short recovery |
|Grab **Back+Attack**| Back inch punch | Short recovery |
|Grab **Down+Attack**| Shadowless Kick | Before launch **Up+Special** Dragon Upper |
|Grab **Up+Attack**| Dragon upper | **Down+Attack** air throw |
|Grab **Jump**| Jump carry | Air **Attack** upper |
|Air **Down+Attack**| Fast land grab | Choose throw quickly on land |
|Air **Up+Attack**| Stomp chain | Breaks air normals |
|Parry| Fire spark | **Forward+Forward+Attack**, **Extra**, short hop, **Down+Special** |


# Selected Boss Guides

## Abadede

- Gladiator Abadede: power boss; Level 3 super and parry counter unblockable; loves dive attacks.
- Uses dash uppercut vs dash grab mixup—wrong guess = huge damage.
- Level 3 super is fast and unblockable—hard to dodge.
- Do not stay point-blank: close special Berserker Roar is multi-hit; launch costs heavy HP, then dive grab or uppercut follow-ups.
- Dive attack also unblockable—dodge or attack; blocking gets you thrown.

## Ash

- Captain Ash: grab-heavy power boss.
- Super grab hitbox is strong—do not trade Reversals during super approach.
- One grab route heals Ash (adult content in original).
- When closing, sometimes normals—parry or launch then combo.
- At range, during taunt, rush in and combo.
- Strong throw escape characters (Max, SOR2 Shiva) excel—**Attack** on grab startup for counter throw.

## Rocky Bear

- Boxer Rocky Bear: power boss; signature rising punch loops and rising punch into Level 3 Super Rising Punch.
- Hook + dash grab mixup; on hit, rising punch loop; at 3+ stars may cancel into Level 3.
- Close range wall-bounce short hook—launches to screen edge and back.

## Barbon

- Bartender Barbon: kick specialist; very accurate parry—parry counter sweeps you airborne.
- Spams dash grab up close—dodge or launch on approach.
- Do not approach at high meter—Level 3 kick barrage hits hard.

## Harkiri

- Armored samurai Harakiri: iaijutsu + homing explosive kunai.
- Two types: aggressive closes and attacks; defensive keeps distance, punishes with parry at mid range.
- Long range: multi homing kunai—destroy or dodge. Holding block lets kunai hit from behind and explode for massive damage; then Harakiri closes for iai into Level 3 Phantom Slash one-touch.
- Iai hit launches you; Harakiri teleports behind for second iai—block late and eat combo into Level 3 Phantom Slash.
- Teleport-dodge makes normals whiff. Dodge with i-frames in, parry iai, launch, combo.
- When launched, air tech; on land watch position and block/parry.
- Huge anti-air vertical slash—do not jump in casually.
- vs defensive Harakiri: do not hold block—he teleports behind for grab. Dodge in, wait for swing, parry, combo.

## Yamato

- Red-armor Yamato: flashiest boss kit; teleport + very fast = few weak points.
- Two types: Musashi (sword iai + Level 3 Phantom Slash from behind); Yamato (shadow clone rush + Level 3 Phantom Slash).
- Teleports constantly; frontal attacks whiff; you recover, he appears behind and punishes.
- Best plan: parry for meter; when he appears behind for iai, use 360 Reversal to launch, then combo.
- Mid range: teleport in dash grab into Iga Drop throw. Fast, multi-pass run—watch afterimages, dodge; attack/block get grabbed.
- Very close: roll jump + 3 kunai; if you dodge kunai, he may air grab Iga Drop on descent.
- Wood Bomb anti-air—do not approach from air.
- vs Musashi: do not hold block—teleport behind Iga Drop. Bait iai, Reversal, combo.

## Zamza

- Claw ninja Zamza: very fast.
- While you block, slide trip into grab loop; on stand, he slides again—break with instant Reversal on wake (he dodges).
- Sometimes air dive grab; air tech window may get re-grabbed in air—limited by his meter.
- Rising claw loops—air tech quickly.
- Repeated grabs: mash **Attack** for throw escape on strong characters.

## Bruce & Roo

- Whip clown Bruce + kangaroo Roo duo. Bruce whips at range; Roo speed/grappling up close.
- Bruce Level 3 lays bomb traps—on trap, launched (air tech). If missed, 3s later huge blast hurts everyone—lure enemies with dodge i-frames near trap.
- Bruce healing aura every 2s heals all on-screen enemies (except Bruce).
- Roo heals/meter under aura during Bruce super and heavy whip.
- Roo alone still heals if Bruce on screen.
- Roo super = dash grab—dodge fast. Parry counter = spin kick multi-hit.

## Jet & Rocket

- Flying Jet & Rocket. Both Level 3 dash grab; Rocket adds flame spray super and floating bomb special.
- Do not chase—stand ground, parry dive attacks.
- After parry launch, **Tap Energy** jump attack juggle.

## Tracker

- Predator Tracker: stealth lock + unblockable homing ion cannon super.
- Level 3: stealth lock—keep dodging with i-frames; appears behind after lock and fires unblockable beam. Constant dodge = beam misses and fades.
- Normal ion cannon blockable but can hit from behind (low damage).
- Dash grab into shock claw—paralyzed, cannot Reversal; then rising attack—air tech.
- Air jump attack becomes air grab + shock claw paralysis + launch; may repeat air grab until out of meter.
- Grab loops: **Tap Attack quickly** for throw escape.

## Break

- Axel clone Break: all Axel moves; speed increases as HP drops.
- Dash uppercut vs dash grab mixup on approach.
- With meter, throws/specials may end in Phantom Lion Punch—huge, fast, hard to dodge.
- Low HP frenzy—finish with combo or get reversed.

## Shiva

- SOR2 and SOR3 Shiva often appear together.
- Boss SOR3 Shiva: any hit can start infinite combo.
- SOR2 Shiva air juggle can one-life you.
- Air palm press grab—do not block air down attack.
- Mid range shadow clone from behind sends you into body combo.
- Keep distance, parry, combo when safe.

## RobotX

- Mass-production robot (SOR3); homing rockets from arms.
- Rockets: dodge until they explode.
- Close full discharge super can one-shot.

## Mr.X

- Final boss Mr.X—machine gun multi-direction fire; Level 3 homing rockets.
- Rockets: dodge until detonation.
- On dodge he throws grenades.
- Close dash grab into punch-kick throw + grenade.

## Monalisa Sisters

- Mona Lisa sisters: jump attacks and sync combos; ground wave super fast but blockable.
- Avoid front/back sandwich—simultaneous kicks, defense fails, rapid death.
- Jump hit leads to air throw; close red-glow dash grab (slow but hard to read).
- Occasional tag combos—not constant.

# Enemy Grunts

## Galsia

- Jeans + vest grunt; sometimes picks up knife.
- Knife Galsia multi-hit quickly knocks down.
- Jumping elbow drop—rare.

## Donovan

- Bald shirtless grunt; sometimes pipe.
- Empty-hand heavy = uppercut; pipe hits hard.
- If you stand over downed Donovan, fast wake-up uppercut—strong.

## Signal

- Mohawk skinny grunt; fast slide.
- Sometimes throws bottles—fast, accurate; priority kill.
- Over downed Signal, slide grab throw.

## Garnet

- Short hair delinquent girl; jump attack at range, slaps up close.
- With meter, jump tackle grab then heals herself (adult content)—you lose HP.

## Jack

- Biker knife thug (SOR2 route stage 1)—author's favorite grunt.
- Empty hand: pulls knife, long-range knife throw.
- Close: fast stab; if you block, grab break into triple stab.
- Always parries up close, armed or not.
- After knocking you down, taunts.

## Electra

- Popular SOR3 whip woman; electric whip left arm.
- Rarely rushes; on approach uses whip special if meter allows else lashes + grab attempts; sometimes fast whip flurry or heal grab (adult content).
- When knocked down, sits sadly—you cannot hit her during animation.

## Bigben & Bongo

- Fire-breathing fat duo; fire breath or body press roll.
- vs blockers, sometimes grab throw.
- Over downed fat, fast body roll—parry immediately ("stop the car").

## Hakuyo & Raven & Tiger

- Hakuyo: braid muay thai muscle; one-hand chi blast.
- Downed wake-up flying kick.
- Hakuyo parries with chi blast—wall bounce launch.
- Raven: vest shorts muay thai; knee specialist; throws + parry.
- Raven downed wake-up knee.

## Kusanagi

- Fast ninja; kunai or katana sometimes.
- Empty: shuriken harass + close grabs.
- Armed: cyclone slash—high damage.
- Parry armed or empty.
- Fast movement, repeated dodge.
- Below 25% HP: red glow suicide grab rush—on grab hit, self-destruct.

## Bruce

- Solo whip clown Bruce; Level 3 bomb traps.
- Step trap = hang launch (air tech safe). Miss = 6s huge blast hits all—including **fast clear trick**: dodge i-frames lure enemies into blast radius.
- Fast wake-up knee after knockdown.

# Hall of Fame

- After version 20240413, K.O counts boss KOs only
- Difficulty hashtag number = player count used for clear
- Arcade mode: +1 player every 100,000 score
- Score 100,000+: each death −100,000 (no penalty if score below 100,000)
- One-life clear records:

| Rank | Route | Character | Time | K.O | Difficulty | Player |
|---|---|---|---|---|---|---|
| 1 | SOR2 | Kage | 01:18:24 | 71 | MANIA#1 | 翼指龙 |
| 2 | SOR2 | Bison | 00:57:24 | 72 | MANIA#1 | 翼指龙 |
| 3 | SOR2 | Max | 01:05:11 | 79 | MANIA#1 | 翼指龙 |
| 5 | SOR2 | Zan | 01:04:48 | 55 | MANIA#1 | 翼指龙 |
| 5 | SOR2 | SOR3 Shiva | 01:06:44 | 81 | MANIA#1 | 霸气 |
| 6 | SOR1 | Max | 00:42:22 | 45 | MANIA#1 | 翼指龙 |


# Credits

- QQ group **657798865** member Menghu—OpenBOR engine optimization
- QQ group **657798865** member Baqi—shared character assets
- QQ group **657798865** community—testing and feedback on every build

# Version

- SOR2XCombo_20260620
