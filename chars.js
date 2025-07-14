//DEBUFFED TARGETS LIST HAS TO BE GLOBAL LIST THAT INCLUDES OBJECTS WITH THE NEXT INFO: TARGET,DISPELLABLE?,DEBUFFER, DEBUFF_ID, TURNS_REMAINING...
//SOMETHING SIMILAR WITH BUFFS

const CORE_STATS = {
  Wisdom: {
    id: "WISDOM",
    boosts: ["mana", "debuffAccuracy"],
    multiplier: [0.25, 0.01]
  },
  Strength: {
    id: "STRENGTH",
    boosts: ["accuracy", "critDamage"],
    multiplier: [0.15, 0.001]
  },
  Stamina: {
    id: "STAMINA",
    boosts: ["hp", "critRes"],
    multiplier: [5, 0.15]
  }
};

const ELEMENTS = {
  Fire: {
    id: 'FIRE',
    uniqueStat: 'Passion',
    boosts: ['critDamage', 'speed'],
    multipliers: [0.001, 0.75],
    damageBonusAgainst: { EARTH: 0.1 }
  },
  Air: {
    id: 'AIR',
    uniqueStat: 'Agility',
    boosts: ['speed', 'evasion'],
    multipliers: [1.2, 1],
    damageBonusAgainst: {}
  },
  Earth: {
    id: 'EARTH',
    uniqueStat: 'Fortitude',
    boosts: ['defense', 'critRes'],
    multipliers: [1, 2],
    damageBonusAgainst: {}
  },
  Water: {
    id: 'WATER',
    uniqueStat: 'Serenity',
    boosts: ['hp', 'healPotency'],
    multipliers: [1, 2],
    damageBonusAgainst: { FIRE: 0.1 }
  },
  Chi: {
    id: 'CHI',
    uniqueStat: 'Focus',
    boosts: ['accuracy', 'critRate'],
    multipliers: [1, 2],
    damageBonusAgainst: {},
    damageReduction: 0.1
  }
};

const CLASSES = {
  Mage: {
    name: "Mage",
    essentialStat: "Wisdom"
  },
  Warrior: {
    name: "Warrior",
    essentialStat: "Strength"
  },
  Guardian: {
    name: "Guardian",
    essentialStat: "Stamina"
  }
};

class BaseCharacter {
  constructor({ name, id, age, element, charClass, baseStats, level = 1, team }) {
    this.name = name;
    this.id = id;
    this.age = age;
    this.element = element;
    this.class = charClass;
    this.level = level;
    this.exp = 0;
    this.team = team
    this.expToNextLevel = this.calculateExpToNextLevel();

    Object.assign(this, baseStats);

    this.baseStats = baseStats
    // this.strength += level * 0.1;
    // this.stamina += level * 0.1;
    // this.wisdom += level * 0.1;

    this.classEssential = CORE_STATS[this.class.essentialStat];
    this.classUnique = element.uniqueStat;

    this.applyStatBoosts();
  }

  calculateExpToNextLevel() {
    return Math.floor(100 + this.level ** 1.5 * 20);
  }

  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNextLevel) {
      this.exp -= this.expToNextLevel;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.expToNextLevel = this.calculateExpToNextLevel();
    this.defense += 5;
    this.strength += 0.1;
    this.stamina += 2.12;
    this.wisdom += 1.15;

    this.applyStatBoosts();
  }
  applyStatBoosts() {
    for (const statName in CORE_STATS) {
      const val = this[statName.toLowerCase()];

      const boosts = CORE_STATS[statName].boosts;
      const multipliers = CORE_STATS[statName].multiplier;

      boosts.forEach((stat, i) => { this[stat] += val * multipliers[i]; });

      if (CORE_STATS[statName] === this.classEssential) this.attack += val;

    }
    // Apply element unique stat boosts
    const uniqueStatKey = this.element.uniqueStat.toLowerCase();
    const uniqueStatValue = this[uniqueStatKey] || 0;

    this.element.boosts.forEach((stat, i) => {
      if (!this[stat]) this[stat] = 0;
      this[stat] += uniqueStatValue * this.element.multipliers[i];
    });
  }

  getStats() {
    return {
      name: this.name,
      level: this.level,
      exp: this.exp,
      expToNextLevel: this.expToNextLevel,
      hp: this.baseHP,
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      mana: this.mana,
      accuracy: this.accuracy,
      evasion: this.evasion,
      critRate: this.critRate,
      critResist: this.critResist,
      critDamage: this.critDamage
    };
  }
}


//CHARACTER

class Sonia extends BaseCharacter {
  constructor(level = 1) {
    super({
      name: "Sonia",
      id: "1",
      age: 21,
      element: ELEMENTS.Fire,
      charClass: CLASSES.Mage,
      baseStats: {
        baseHp: 3000,
        attack: 250,
        defense: 80,
        speed: 110,
        mana: 300,
        accuracy: 80,
        evasion: 2,
        critRate: 0.5,
        critResist: 0.12,
        critDamage: 1.15,
        debuffAccuracy: 10,
        strength: 5,
        stamina: 7,
        wisdom: 15,
        passion: 2,
      },
      level,
      team: "ally"
    });
    this.maxHP = this.baseHp
    this.currentHP = this.baseHp
    this.debuffTargets = []
    this.finalDamageModificator = 0
    this.passiveDMGBuff = 0

    this.skill1 = {
      name: "Flames Arise",
      description: ` Sonia lets out a burst of fire magic provoking multipe fire burst to rise from beneath the enemies.`,
      level1: ` Deals 60% of Sonia's attack 4 times at enemies at random, inflicting Burning Heat for 2 turns. Burning Heat deals 2% of the enemy's max HP each turn.
                  For each stack of Burning Heat succesfully applied, this skill has 20% chance of dealing an extra attack to the last target affected by Burning Heat.
                  Once an additional attack is triggered, the chance resets to 20%`,
      level2: ` The attack amount increases to 5`,
      level3: ` The skill damage is now equal to 80% of Sonia's attack and the chance of dealing an extra attack is now 25%`,
      Evolution: ` Every multiplier of this ability is increased by 10% of its base value.`,
      cooldown: 0
    }

    this.skill2 = {
      name: "Fire Ball",
      description: "Sonia shoots a flaming fire ball towards the enemies.",
      level1: ` This attack deals 160% of Sonia's attack to one random target. Additionaly, per each stack of Burning Heat, this skill has a 20% to recast.`,
      level2: ` Additionally, if the target is inflicted by Burning Heat, this attack enjoys +20% crit damage and accuracy.`,
      level3: ` The chance of recasting this skill per Burning Heat stack becomes 33%`,
      Evolution: ` Every multiplier of this ability is increased by 10% of its base value.`,
      cooldown: 0

    }

    this.passive1 = {
      name: "Intense Heat",
      description: "Sonia's passion for a thrilling battle strengthens her magic.",
      level1: "For each succesful crit, Sonia's damage increases by 4%, up to 16%. If an attack doesnt crit, this damage bonus is reduced by 5%",
      level2: "The damage increase is now 5%, up to 20%.",
      level3: "The reduction of the damage bonus after missing a crit is now 4%"

    }

    this.passive2 = {
      name: "Growing Flame",
      description: "The longer the fight goes on, the hotter her flames become.",
      level1: `For each turn, increases her crit rate by 3%, and crit damage by 5%. Each time Sonia's takes damage, this buff is reduced by
                1.5% and 2.5% respectively.`,
      level2: `The increase on her crit rate and crit damage respectively becomes 3.5% and 6%`,
      level3: `The decrease on her crit rate and crit damage respectively becomes 1.25% and 2%`
    }

    this.special = {
      name: "Inferno",
      description: "Sonia's focuses, gathering all her magic fire and channeling it onto one target.",
      level1: `Triggers every stack of Burning Heat and clears them. For every stack of Burning Heat triggered, Sonia deals an attack equal to 
                50% of her attack to the enemy with the highest HP`,
      level2: `The damage is now equal to 60% of her attack`,
      level3: `Additionaly, for each stack of Burning Heat triggered, deals an extra attack equal to 1% of the target max HP x stacks triggered`
    }

  }
  skillsInfo() {
    //  return {skill1: this.skill1, skill2, passive1, passive2, special}
  }

  act() {

    const skill1 = this.skill1
    const skill2 = this.skill2

    if (skill1.cooldown == 0) {
      this.s1()
      skill1.cooldown = 2

    } else {
      this.triggerBurningHeat()

      if(skill2.cooldown != 0) skill2.cooldown -= 1
      else {
            this.s2()
            skill2.cooldown = 2
      }
      
      skill1.cooldown -= 1
    }
    console.log("SKILL1 CD", skill1.cooldown, "SKILL2 CD", skill2.cooldown)
  }
  s1() {
    this.debuffTargets = []

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const randomInt = Math.floor(Math.random() * 3);

        const target = enemies[randomInt]


        const result = calculateDamage(sonia, target, 0.6)

        //if not a missed hit, check if it is crit for passive 1 effects.
        if (!result.missed) this.p1(result.isCrit)

        //will move this somewhere else eventually, as a separate function
        const effectiveDebuffAcc = sonia.debuffAccuracy - target.debuffResist
        const applyDebuff = Math.random() * 10 < effectiveDebuffAcc;

        if (applyDebuff && !this.debuffTargets.includes(target)) this.debuffTargets.push(target)

        console.log(result)
      }, i * 200);
    }
  }

  triggerBurningHeat() {

    this.debuffTargets.forEach(enemy => {
      const dmg = enemy.maxHP * 0.02
      enemy.currentHP -= dmg
      console.log("BURN DEBUFF DAMAGE:", dmg, `(${enemy.currentHP})`)
      updateHPBar(enemy)
    });

  }
  s2() { 
      //make chance depend on skill level
      const chance = 20
      var recast = null;
      var target = enemies[Math.round(Math.random() * (enemies.length - 1))]

      const result = calculateDamage(sonia, target, 1.6)

      const recastChance = chance * this.debuffTargets.length
      if (!result.missed) this.p1(result.isCrit)
      if(Math.random() * 100 < recastChance) {
          target = enemies[Math.round(Math.random() * (enemies.length - 1))]
          recast = calculateDamage(sonia, target, 1.6)
          if (!result.missed) this.p1(recast.isCrit)
          console.log("RECAST")
      } 

      console.log(result, recast)
  }

  p1(isCrit) {

    //make incr/decr depend on skill level
    const increase = 4
    const decrease = 4

    this.finalDamageModificator - this.passiveDMGBuff == 0 ? this.finalDamageModificator = 0 : this.finalDamageModificator -= this.passiveDMGBuff

    if (isCrit && this.passiveDMGBuff < 20) (this.passiveDMGBuff + increase > 20) ? this.passiveDMGBuff = 20 : this.passiveDMGBuff += increase
    else if (!isCrit && this.passiveDMGBuff >= 0) this.passiveDMGBuff - decrease < 0 ? this.passiveDMGBuff = 0 : this.passiveDMGBuff -= decrease


    this.finalDamageModificator += this.passiveDMGBuff
    console.log("PASSIVE DMG BONUS:", this.passiveDMGBuff)

  }
  p2() {

  }
  ultimate() { }
}

//ENEMY

class enemyTest extends BaseCharacter {
  constructor(level = 1, name) {
    super({
      name: name,
      id: "2",
      age: 1,
      element: ELEMENTS.Fire,
      charClass: CLASSES.Mage,
      baseStats: {
        baseHp: 3000,
        attack: 150,
        defense: 80,
        speed: 110,
        mana: 300,
        accuracy: 60,
        evasion: 2,
        critRate: 0.5,
        critDamage: 1.10,
        critResist: 0.12,
        debuffResist: 4,
        strength: 5,
        stamina: 7,
        wisdom: 15,
        passion: 2
      },
      level,
      team: "enemy"
    });
    this.finalDamageModificator = 0
    this.maxHP = this.baseHp
    this.currentHP = this.baseHp
  }

  act() {
    this.basicAttack()
  }

  basicAttack() {
    console.log(calculateDamage(this, sonia, 0.5))
  }
}

const dummy = new enemyTest(1, "Slime1")
dummy.gainExp(500)
const dummy2 = new enemyTest(1, "Slime2")
dummy2.gainExp(1500)
const dummy3 = new enemyTest(1, "Slime3")
dummy3.gainExp(300)

const enemies = [dummy, dummy2, dummy3]

const sonia = new Sonia(5);
console.log(sonia.getStats());

sonia.gainExp(5000);
console.log(sonia.getStats());

const a = sonia.getStats()
const b = dummy.getStats()



function calculateDamage(attacker, target, percent) {
  // accuracy
  const hitChance = attacker.accuracy - target.evasion;
  const random = Math.random() * 100;
  //miss check
  if (random > hitChance) {
    return { missed: true, damage: 0, attacker, name: target.name };
  }

  // crit check
  const effectiveCritRate = Math.max(0, attacker.critRate - target.critResist);
  const isCrit = Math.random() * 1 < effectiveCritRate;

  //atk percentage
  const scaledAttack = attacker.attack * percent;

  // defense
  const baseDamage = scaledAttack - (target.defense * 0.25);

  // crit calc
  let finalDamage = baseDamage;
  if (isCrit) finalDamage = finalDamage * attacker.critDamage

  finalDamage += finalDamage * (attacker.finalDamageModificator / 100)
  const damageTaken = Math.round(finalDamage);
  target.currentHP = Math.max(0, target.currentHP - damageTaken);

  updateHPBar(target)

  return {
    missed: false,
    isCrit,
    damage: damageTaken,
    name: this.name,
    attacker
  };
}
function updateHPBar(target) {

  const hpRatio = target.currentHP / target.maxHP
  const hpBarPX = Math.max(0, hpRatio * 100)

  $(`#${target.name}`).css('height', `${hpBarPX}px`)

}

currentCharacters = [sonia, dummy, dummy2, dummy3]


function start() {

  const sortBySpeed = currentCharacters.sort((a, b) => b.speed - a.speed);

  console.log(sortBySpeed)
  $.each(currentCharacters, function (i, character) {
    if (character.team == "ally") $('#team').append(`<div class="square" id=${character.name}> ${character.name} </div>`);
    else $('#enemies').append(`<div class="square" id=${character.name}>  ${character.name} </div>`);
  });


}

function turns() {
    $.each(currentCharacters, function (i, character) {
    setTimeout(() => {
      character.act();
    }, i * 2000);
  });
    setTimeout(() => {
    turns();
  }, currentCharacters.length * 2000);
 }

