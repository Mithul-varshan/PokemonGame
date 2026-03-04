const battleBackgroundImage = new Image()
battleBackgroundImage.src = './img/battleBackground.png'
const battleBackground = new Sprite({
  position: {
    x: 0,
    y: 0
  },
  image: battleBackgroundImage
})

let draggle
let emby
let renderedSprites
let battleAnimationId
let queue

let isPlayerTurn = true
let canSwitchMonster = false

let battlesWon = 0

// Party system
let playerParty = []
let currentPartyIndex = 0
let enemyParty = []
let currentEnemyIndex = 0

const availableEnemies = ['Draggle', 'Draggle2', 'Draggle3']

function setAttackButtonDisabled(disabled) {
  document.querySelectorAll('#attacksBox button').forEach((button) => {
    button.disabled = disabled
  })
}

// Initialize player party at game start
function initializePlayerParty() {
  playerParty = []
  // Create 3 Emby monsters with different levels
  for (let i = 0; i < 3; i++) {
    const newMonster = new Monster(monsters.Emby)
    newMonster.level = 1 + i // Level 1, 2, 3
    newMonster.xp = 0
    newMonster.maxHealth = newMonster.health
    playerParty.push(newMonster)
  }
  currentPartyIndex = 0
}

// Get current active player monster
function getActivePlayerMonster() {
  return playerParty[currentPartyIndex]
}

// Switch to next available monster
function switchToNextMonster() {
  const currentIndex = currentPartyIndex
  for (let i = 1; i < playerParty.length; i++) {
    const nextIndex = (currentIndex + i) % playerParty.length
    if (playerParty[nextIndex].health > 0) {
      currentPartyIndex = nextIndex
      return playerParty[nextIndex]
    }
  }
  return null // No available monsters
}

// Get count of alive monsters in party
function getAliveMonstersCount() {
  return playerParty.filter((m) => m.health > 0).length
}

// Update HP text displays
function updateHealthDisplay() {
  const playerMon = getActivePlayerMonster()
  const enemyMon = draggle

  document.querySelector('#playerHPText').innerHTML =
    playerMon.health + '/' + playerMon.maxHealth + ' HP'
  document.querySelector('#enemyHPText').innerHTML =
    enemyMon.health + '/' + enemyMon.maxHealth + ' HP'

  // Update party display as well
  updatePartyDisplay()
}

// Update party display UI
function updatePartyDisplay() {
  const partyList = document.querySelector('#partyList')
  partyList.innerHTML = ''

  playerParty.forEach((mon, index) => {
    const status =
      mon.health <= 0 ? '(Fainted)' : mon.health + '/' + mon.maxHealth
    const color =
      mon.health <= 0
        ? '#999'
        : mon.health < mon.maxHealth * 0.3
          ? '#ff0000'
          : '#000'
    const bold = currentPartyIndex === index ? 'bold' : 'normal'

    const html = `
      <div style="
        margin: 4px 0;
        font-weight: ${bold};
        color: ${color};
        padding: 4px;
        border: ${currentPartyIndex === index ? '1px solid black' : 'none'};
      ">
        ${index + 1}. ${mon.name}
        <br/>
        <span style="font-size: 7px;">${status}</span>
      </div>
    `
    partyList.innerHTML += html
  })
}

function initBattle() {
  document.querySelector('#userInterface').style.display = 'block'
  document.querySelector('#partyDisplay').style.display = 'block'
  document.querySelector('#dialogueBox').style.display = 'none'
  document.querySelector('#enemyHealthBar').style.width = '100%'
  document.querySelector('#playerHealthBar').style.width = '100%'
  document.querySelector('#enemyHealthBar').style.backgroundColor = '#4efb38'
  document.querySelector('#playerHealthBar').style.backgroundColor = '#4efb38'
  document.querySelector('#attacksBox').replaceChildren()

  // Initialize party if not done yet
  if (playerParty.length === 0) {
    initializePlayerParty()
  }

  const randomEnemyName =
    availableEnemies[Math.floor(Math.random() * availableEnemies.length)]

  draggle = new Monster(monsters[randomEnemyName])
  draggle.maxHealth = draggle.health

  emby = getActivePlayerMonster()

  // Update UI with current monster names
  document.querySelector('#userInterface').querySelector('h1').innerHTML =
    draggle.name
  document.querySelector('#userInterface').querySelectorAll('h1')[1].innerHTML =
    emby.name + ' (Lv. ' + emby.level + ')'

  renderedSprites = [draggle, emby]
  queue = []
  isPlayerTurn = true
  canSwitchMonster = false

  updateHealthDisplay()
  updatePartyDisplay()

  emby.attacks.forEach((attack) => {
    const button = document.createElement('button')
    button.innerHTML = attack.name
    document.querySelector('#attacksBox').append(button)
  })

  // our event listener for our buttons (attack)
  document.querySelectorAll('#attacksBox button').forEach((button) => {
    button.addEventListener('click', (e) => {
      if (!isPlayerTurn) return
      isPlayerTurn = false
      setAttackButtonDisabled(true)
      const selectedAttack = attacks[e.currentTarget.innerHTML]
      emby.attack({
        attack: selectedAttack,
        recipient: draggle,
        renderedSprites
      })

      updateHealthDisplay()

      if (draggle.health <= 0) {
        queue.push(() => {
          draggle.faint()
        })
        queue.push(() => {
          battlesWon++
          emby.xp += 30
          // Level up if XP reaches 100
          if (emby.xp >= 100) {
            emby.xp = emby.xp - 100
            emby.level++
            document.querySelector('#dialogueBox').innerHTML =
              'Level Up! ' + emby.name + ' is now level ' + emby.level + '!'
            document.querySelector('#dialogueBox').style.display = 'block'
          } else {
            document.querySelector('#dialogueBox').innerHTML =
              'Victory! Battles won: ' + battlesWon
            document.querySelector('#dialogueBox').style.display = 'block'
          }
        })
        queue.push(() => {
          //fade back to black
          gsap.to('#overlappingDiv', {
            opacity: 1,
            onComplete: () => {
              cancelAnimationFrame(battleAnimationId)
              animate()
              document.querySelector('#userInterface').style.display = 'none'
              document.querySelector('#partyDisplay').style.display = 'none'

              gsap.to('#overlappingDiv', {
                opacity: 0
              })

              battle.initiated = false
              audio.Map.play()
            }
          })
        })
      }

      // draggle or enemy attacks right here
      const randomAttack =
        draggle.attacks[Math.floor(Math.random() * draggle.attacks.length)]

      queue.push(() => {
        draggle.attack({
          attack: randomAttack,
          recipient: emby,
          renderedSprites
        })

        updateHealthDisplay()

        if (emby.health <= 0) {
          queue.push(() => {
            emby.faint()
          })

          queue.push(() => {
            // Check if player has more monsters
            if (getAliveMonstersCount() > 1) {
              // Show switch prompt
              canSwitchMonster = true
              document.querySelector('#dialogueBox').innerHTML =
                emby.name +
                ' fainted! Press SPACE to switch Pokemon or click here to continue'
              document.querySelector('#dialogueBox').style.display = 'block'
            } else {
              // Game over
              gsap.to('#overlappingDiv', {
                opacity: 1,
                onComplete: () => {
                  cancelAnimationFrame(battleAnimationId)
                  animate()
                  document.querySelector('#userInterface').style.display =
                    'none'
                  document.querySelector('#partyDisplay').style.display = 'none'

                  gsap.to('#overlappingDiv', {
                    opacity: 0
                  })

                  battle.initiated = false
                  audio.Map.play()
                }
              })
            }
          })
        }
      })
    })

    button.addEventListener('mouseenter', (e) => {
      const selectedAttack = attacks[e.currentTarget.innerHTML]
      document.querySelector('#attackType').innerHTML = selectedAttack.type
      document.querySelector('#attackType').style.color = selectedAttack.color
    })
  })
  setAttackButtonDisabled(false)
}

function animateBattle() {
  battleAnimationId = window.requestAnimationFrame(animateBattle)
  battleBackground.draw()

  renderedSprites.forEach((sprite) => {
    sprite.draw()
  })
}

animate()
// initBattle()
// animateBattle()

function activatePartyMonster(targetIndex) {
  const targetMonster = playerParty[targetIndex]
  if (!targetMonster || targetMonster.health <= 0) return false

  currentPartyIndex = targetIndex
  emby = targetMonster
  emby.position = { x: 280, y: 325 }
  emby.opacity = 1
  renderedSprites[1] = emby

  document.querySelector('#userInterface').querySelectorAll('h1')[1].innerHTML =
    emby.name + ' (Lv. ' + emby.level + ')'

  updateHealthDisplay()
  updatePartyDisplay()
  document.querySelector('#dialogueBox').style.display = 'none'
  isPlayerTurn = true
  canSwitchMonster = false
  setAttackButtonDisabled(false)

  return true
}

// Party switching with number keys during battle
document.addEventListener('keydown', (e) => {
  if (!battle.initiated) return

  const key = parseInt(e.key)
  if (Number.isNaN(key) || key < 1 || key > playerParty.length) return

  if (!canSwitchMonster && !isPlayerTurn) return

  const targetIndex = key - 1
  if (targetIndex === currentPartyIndex) return

  activatePartyMonster(targetIndex)
})

document.querySelector('#dialogueBox').addEventListener('click', (e) => {
  if (canSwitchMonster) {
    // If a monster fainted, prompt to switch
    const nextMonster = switchToNextMonster()
    if (nextMonster) {
      activatePartyMonster(currentPartyIndex)
      e.currentTarget.style.display = 'none'
    }
  } else if (queue.length > 0) {
    queue[0]()
    queue.shift()
  } else {
    e.currentTarget.style.display = 'none'
    isPlayerTurn = true
    setAttackButtonDisabled(false)
  }
})
