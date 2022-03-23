const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')

const bot = mineflayer.createBot({
  host: 'localHost',
  port: 56057,
  username: 'Ender_Sin'

})

bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)



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




const entity = bot.nearestPlayer()
if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))

function defense() {
  const filter = e => e.type === 'player' && e.position.distanceTo(bot.entity.position) < 5 &&
    e.mobType != 'Armor Stand'

  const enemy = bot.nearestEntity(filter)

  bot.on("entityHurt", (entity) => {
    if (entity != bot.entity) return;

    bot.pvp.attack(enemy)

  });


  if (message === 'xd') {
    const boss = bot.players[username]

  }


  if (message === 'fight me') {
    const player = bot.players[username]
    bot.chat('DIIEEE')
    bot.pvp.attack(player.entity)
  }

  if (message === 'defend') {
    const player = bot.players[username]
    if (player === boss) {
      bot.setControlState('jump')
      defense()
    }

  }
}
