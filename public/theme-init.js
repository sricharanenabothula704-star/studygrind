try {
  var s = JSON.parse(localStorage.getItem('studygrind-v1') || '{}')
  var t = s && s.state && s.state.theme
  document.documentElement.classList.toggle('dark', t !== 'light')
} catch {
  document.documentElement.classList.add('dark')
}
