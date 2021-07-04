
const CODEMIRROR_THEMES =
    ['3024-night', 'abcdef', 'ambiance', 'base16-dark', 'bespin', 'blackboard', 'cobalt', 'colorforth', 'dracula', 'erlang-dark', 'hopscotch', 'icecoder', 'isotope', 'lesser-dark', 'liquibyte', 'material', 'mbo', 'mdn-like', 'monokai'];

function generateTheme() {
    return CODEMIRROR_THEMES[Math.floor(Math.random() * CODEMIRROR_THEMES.length)];
}

module.exports = generateTheme;