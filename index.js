const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const {
    pathfinder,
    Movements,
    goals
} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const GoalFollow = goals.GoalFollow
const Vec3 = require('vec3');
const weapon = 'bow'
let mcData


const bot = mineflayer.createBot({
    host: '',
    port: '',
    username: 'placeholder',
    version: '1.20.2'
})

bot.once('spawn', () => {
    mcData = require('minecraft-data')('1.20.2')
    console.log("bot initiated")

})


bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)
const minecraftHawkEye = require('minecrafthawkeye');
bot.loadPlugin(minecraftHawkEye)


bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

bot.on('playerCollect', (collector, itemDrop) => {
    if (collector !== bot.entity) return
  
    setTimeout(() => {
      bot.armorManager.equipAll()
    }, 150)
  })

bot.on('physicTick', () => {
    if (bot.isBusy) return
    else{
    if (bot.pvp.target) return
    if (bot.pathfinder.isMoving()) return

    const entity = bot.nearestEntity()
    if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
    }
})

//try to do a function. on(player.joined) {bot.chat('wsp')} smth like this

function followPlayer() {
    const theog = bot.players['SridaPOG'] //change this to the player you want to follow

    if (!theog || !theog.entity) {
        return
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    //movements.scafoldingBlocks = [] change this to stop bridging

    bot.pathfinder.setMovements(movements)

    const goal = new GoalFollow(theog.entity, 1)
    bot.pathfinder.setGoal(goal, true)
}


function defense() {

    bot.on('entityHurt', (entity) => {
        if (entity != bot.entity) return;
        else{
            const filter2 = e => e.type === 'mob' || e.type === 'player' && e.position.distanceTo(bot.entity.position) < 16 && e.mobType !== 'Armor Stand'
            const enemy = bot.nearestEntity(filter2)
            if (enemy) {

                bot.pvp.attack(enemy)

            }
        }
    });
}

function heal() {
    while (bot.health < 4 && bot.health > 18) {
        const food = bot.inventory.items().find(item => item.name.includes('beef' || 'pork' || 'chicken'))
        if (food) bot.equip(food, 'hand') 
        food.consume()
    }
}
async function sleep() {
    while (bot.time.timeOfDay >= 12000) {
        const bed = bot.findBlock({
            matching: block => bot.isABed(block)
        })
        if (bed) {
            try {
                await bot.sleep(bed)
                time.sleep(10000)
                await bot.wake()
            } catch (err) {
                console.log(err)
            }
        }

    }
}

async function minediamonds() {

    const diamonds = bot.findBlock({
        matching: mcData.blocksByName.diamond_ore.id,
        maxDistance: 64
    })

    if (diamonds) {
        // If we found one, collect it.
        try {
            await bot.collectBlock.collect(diamonds)
        } catch (err) {
            console.log(err) // Handle errors, if any
        }
    } else {
        bot.chat("no diamonds found")
    }


}



async function depositLoot() {
    const itemsToKeep = ['diamond_pickaxe', 'diamond_axe', 'diamond_sword', 'shield', 'diamond_shovel']
    const chest = await bot.openChest(bot.blockAt(new Vec3(16, 64, -13)))
    for (const item of chest.items()) {
      if (!itemsToKeep.includes(item.name)) await chest.deposit(item.type, item.metadata, item.count)
    }
    chest.close()
}


async function movetobase() {
    bot.pathfinder.setMovements(new Movements(bot, mcData))
    bot.pathfinder.setGoal(new goals.GoalBlock(27, 64, -15))

}
let guardPos = null

// Assign the given location to be guarded
function guardArea (pos) {
  guardPos = pos
  // We we are not currently in combat, move to the guard pos
  if (!bot.pvp.target) {
    moveToGuardPos()
  }
} 

// Cancel all pathfinder and combat
function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

// Pathfinder to the guard position
function moveToGuardPos () {
  bot.pathfinder.setMovements(new Movements(bot))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

// Called when the bot has killed it's target.
bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

// Check for new enemies to attack
bot.on('physicsTick', () => {
  if (!guardPos) return // Do nothing if bot is not guarding anything

  // Only look for mobs within 16 blocks
  const hostilemies = ['Spider', 'Cave Spider', 'Enderman', 'Piglin', 'Hoglin', 'Zombified Piglin', 'Evoker', 'Vindicator', 'Illager', 'Ravager', 'Ravager Jockey', 'Vex', 'Chicken Jockey', 'Endermite', 'Guardian', 'Elder Guardian', 'Shulker', 'Skeleton Horseman', 'Husk', 'Stray', 'Blaze', 'Creeper', 'Ghast', 'Magma Cube', 'Silverfish', 'Skeleton', 'Spider Jockey', 'Zombie', 'Zombie Villager', 'Drowned', 'Wither Skeleton', 'Witch', 'Zoglin', 'Piglin Brute', 'Ender Dragon', 'Wither', 'Warden', ]
  const filter = e => hostilemies.includes(e.displayName)  && e.position.distanceTo(bot.entity.position) < 32 &&
                    e.displayName !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity && bot.entity.position.distanceTo(entity.position) < 5) {
    // Start attacking
    bot.pvp.attack(entity)
  }
  else{
    if (entity && bot.entity.position.distanceTo(entity.position) > 5){
        bot.hawkEye.autoAttack(entity, weapon)
    }
  }
  if(!entity){
    bot.hawkEye.stop()
  }
})


bot.on('chat', (username, message) => {

    if (message === 'fight me') {
        if (!guardPos){
            const player = bot.players[username]

            bot.chat('prep to get rekk bub.')
            bot.on('physicsTick', () => {
                if (player && bot.entity.position.distanceTo(player.entity.position) < 5){
                    bot.pvp.attack(player.entity)
                }
                if (player && bot.entity.position.distanceTo(player.entity.position) > 5){
                    bot.hawkEye.autoAttack(player.entity, weapon)
                }
                if (!player){
                    bot.chat('aight imma head out')
                }
            })

    }
    }
    if (message === 'guard me') {
        const player = bot.players[username]
        if (username === "SridaPOG") {
            guardArea(player.entity.position)
            bot.chat('aight im on it')

        }
    }
    if (message === 'tpa to me') {
        const player = bot.players[username]
        if (username === "SridaPOG") {
            bot.chat('/tpaccept')
            bot.chat('ok bro')

        }
    }
    if (message === 'defend') {

        if (username === "SridaPOG") {

            defense()
        }
    }

    if (message === 'follow') {

        if (username === "SridaPOG") {

            followPlayer()
        }
    }
    if (message === 'move to base') {

        if (username === "SridaPOG") {

            movetobase()
        }
    }
    /*if (message === 'pluhbleh') {

        if (username === "SridaPOG") {

            bot.chat('/sethome')
        }
    }*/
    if (message === 'mine diamonds') {

        if (username === "SridaPOG") {

            minediamonds()
        }
    }



    if (message === 'drop loot') {

        if (username === "SridaPOG") {

            depositLoot()
        }
    }

    if (message === 'stop') {
        if (username === "SridaPOG") {

            stopGuarding()
            bot.chat('aight bro chill')

        }
    }

    
})
