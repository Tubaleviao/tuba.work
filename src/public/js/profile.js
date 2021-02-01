let checkPass = () => {
  let p1 = document.getElementById('p1')
  let p2 = document.getElementById('p2')
  if (p1.value === p2.value) p2.style.color = 'green';
  else p2.style.color = 'red'
}

let checkform = () => {
  let p1 = document.getElementById('p1')
  let p2 = document.getElementById('p2')
  document.getElementById('jwt').value = getJWT()
  document.getElementById('user').value = getUser()
  if (p1.value === p2.value) return true;
  else {
    alert("Passwords should match!")
    return false
  }
}