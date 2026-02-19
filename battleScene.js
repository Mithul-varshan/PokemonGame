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

let embyLevel = 1
let embyXP = 0
let battlesWon = 0

const availableEnemies = ['Draggle', 'Draggle']

function setAttackButtonDisabled(disabled) {
  document.querySelectorAll('#attacksBox button').forEach((button) => {
    button.disabled = disabled
  })
}

function initBattle() {
  document.querySelector('#userInterface').style.display = 'block'
  document.querySelector('#dialogueBox').style.display = 'none'
  document.querySelector('#enemyHealthBar').style.width = '100%'
  document.querySelector('#playerHealthBar').style.width = '100%'
  document.querySelector('#enemyHealthBar').style.backgroundColor = '#4efb38'
  document.querySelector('#playerHealthBar').style.backgroundColor = '#4efb38'
  document.querySelector('#attacksBox').replaceChildren()
  const randomEnemyName =
    availableEnemies[Math.floor(Math.random() * availableEnemies.length)]

  draggle = new Monster(monsters[randomEnemyName])

  emby = new Monster(monsters.Emby)
  emby.level = embyLevel
  emby.xp = embyXP
  renderedSprites = [draggle, emby]
  queue = []
  isPlayerTurn = true
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

      if (draggle.health <= 0) {
        queue.push(() => {
          draggle.faint()
        })
        queue.push(() => {
          battlesWon++
          embyXP += 30
          // Level up if XP reaches 100
          if (embyXP >= 100) {
            embyXP = embyXP - 100
            embyLevel++
            emby.level = embyLevel
            emby.xp = embyXP
            document.querySelector('#dialogueBox').innerHTML =
              'Level Up! ' + emby.name + ' is now level ' + embyLevel + '!'
            document.querySelector('#dialogueBox').style.display = 'block'
          } else {
            emby.xp = embyXP
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

        if (emby.health <= 0) {
          queue.push(() => {
            emby.faint()
          })

          queue.push(() => {
            // fade back to black
            gsap.to('#overlappingDiv', {
              opacity: 1,
              onComplete: () => {
                cancelAnimationFrame(battleAnimationId)
                animate()
                document.querySelector('#userInterface').style.display = 'none'

                gsap.to('#overlappingDiv', {
                  opacity: 0
                })

                battle.initiated = false
                audio.Map.play()
              }
            })
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

  console.log(battleAnimationId)

  renderedSprites.forEach((sprite) => {
    sprite.draw()
  })
}

animate()
// initBattle()
// animateBattle()

document.querySelector('#dialogueBox').addEventListener('click', (e) => {
  if (queue.length > 0) {
    queue[0]()
    queue.shift()
  } else {
    e.currentTarget.style.display = 'none'
    isPlayerTurn = true
    setAttackButtonDisabled(false)
  }
})
