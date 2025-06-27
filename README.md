# Calendar Puzzle Solver

A digital implementation of the popular calendar puzzle game where you arrange puzzle pieces to cover all dates except the current date.

## 🎯 Game Overview

The Calendar Puzzle is a daily brain teaser where:
- The board contains months (Jan-Dec), days (1-31), and weekdays (Mon-Sun)
- You have 8 unique polyomino puzzle pieces
- The goal is to place all pieces so they cover every square except today's date (month, day, and weekday)
- Each day has a unique solution!

## 🚀 Features

### Interactive Gameplay
- **Drag & Drop**: Drag pieces from the sidebar onto the board
- **Click to Place**: Select a piece and click on the board to place it
- **Visual Feedback**: Pieces change color when placed, errors are highlighted
- **Real-time Validation**: Immediate feedback on piece placement

### Piece Manipulation
- **Rotate**: Rotate selected pieces 90 degrees clockwise
- **Flip**: Horizontally flip selected pieces
- **Remove**: Click on placed pieces to remove them

### Smart Features
- **Auto-Solver**: Let the computer find a solution for you
- **Hint System**: Get helpful tips when you're stuck
- **Date Selection**: Choose any date to solve
- **Reset Function**: Clear the board and start over

### Visual Design
- **Modern UI**: Clean, responsive design with smooth animations
- **Color-Coded**: Each piece has a unique color for easy identification
- **Responsive**: Works on desktop and mobile devices
- **Target Highlighting**: Current date squares are highlighted in yellow

## 🎮 How to Play

1. **Set the Date**: Use the dropdown menus to select month, day, and weekday
2. **Place Pieces**: 
   - Drag pieces from the right panel onto the board
   - Or click a piece to select it, then click where you want to place it
3. **Manipulate Pieces**: 
   - Select a piece and use Rotate/Flip buttons to change its orientation
   - Click on placed pieces to remove them
4. **Win Condition**: Cover all squares except the three target date squares
5. **Get Help**: Use the Hint button or Auto Solve if you're stuck

## 🧩 Board Layout

The board is arranged as follows:
```
JAN FEB MAR APR  1   2   3  MON TUE
MAY  4   5   6   7   8   9  WED  -
JUN 10  11  12  13  14  15  THU  -
JUL 16  17  18  19  20  21  FRI SAT
AUG 22  23  24  25  26  27  SUN  -
SEP OCT NOV DEC  28  29  30  31  -
```

## 🔧 Technical Details

### Files
- `index.html` - Main game interface
- `styles.css` - Styling and animations
- `game.js` - Game logic and interactions

### Technologies Used
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid, animations
- **Vanilla JavaScript** - Game logic, drag & drop, solver algorithm

### Key Classes
- `CalendarPuzzle` - Main game controller
- Handles board setup, piece management, win conditions
- Includes basic auto-solver with random placement strategy

## 🎨 Customization

The game can be easily customized:

### Adding New Pieces
```javascript
{ id: 'K', shape: [[0,0], [0,1], [1,0]], color: '#custom-color' }
```

### Changing Board Layout
Modify the `boardLayout` array in the `CalendarPuzzle` constructor.

### Styling
All visual elements can be customized through CSS variables and classes.

## 🐛 Known Limitations

- Auto-solver uses a simple random strategy (not optimal)
- Some date combinations may be very difficult or impossible
- Piece shapes are fixed (based on common calendar puzzle designs)

## 🚀 Getting Started

1. Clone or download the files
2. Open `index.html` in a web browser
3. Start solving puzzles!

No installation or build process required - just open and play!

## 🔮 Future Enhancements

- [ ] Advanced backtracking solver algorithm
- [ ] Puzzle difficulty rating
- [ ] Solution history and statistics
- [ ] Multiple puzzle piece sets
- [ ] Multiplayer competitions
- [ ] Mobile app version

## 🤝 Contributing

Feel free to submit issues and enhancement requests! The codebase is designed to be easily extensible.

---

**Enjoy solving your daily calendar puzzle!** 🧩✨ 