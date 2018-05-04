import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;
const BLACK_STONE = '●';
const WHITE_STONE = '○';

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(x, y) {
    return (
      <Square
        value={this.props.squares[y][x]}
        onClick={() => this.props.onClick(x, y)}
      />
    );
  }

  renderLine(y) {
    const rows = [];
    for (let x = 0; x < this.props.squares[y].length; x++) {
      rows.push(<span>{this.renderSquare(x, y)}</span>);
    }
    return (
      <div className="board-row">
        {rows}
      </div>
    )
  }

  render() {
    const lines = []
    for (let y = 0; y < this.props.squares.length; y++) {
      lines.push(<div>{this.renderLine(y)}</div>);
    }

    return (
      <div>
        {lines}
      </div>
    );
  }
}

class Game extends React.Component {
  constructor() {
    super();
    this.state = {
      history: [{
        squares: Array.from(new Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill(null))
      }],
      stepNumber: 0,
      blackIsNext: true,
    };
    this.state.history[0].squares[3][3] = WHITE_STONE;
    this.state.history[0].squares[3][4] = BLACK_STONE;
    this.state.history[0].squares[4][3] = BLACK_STONE;
    this.state.history[0].squares[4][4] = WHITE_STONE;
  }

  handleClick(x, y) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    if (current.squares[y][x]) {
      return;
    }

    const squares = Array.from(new Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill(null));
    for (let y = 0; y < squares.length; y++) {
      for (let x = 0; x < squares[y].length; x++) {
        squares[y][x] = current.squares[y][x];
      }
    }

    const putStone = (this.state.blackIsNext ? BLACK_STONE : WHITE_STONE);
    const reversed = reverseStones(x, y, putStone, squares);
    if (reversed == 0) {
      return;
    }

    squares[y][x] = this.state.blackIsNext ? BLACK_STONE : WHITE_STONE;
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      blackIsNext: !this.state.blackIsNext,
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      blackIsNext: (step % 2) === 0,
    })
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ?
        'Move #' + move :
        'Game start';
      return (
        <li key={move}>
          <a href="#" onClick={() => this.jumpTo(move)}>{desc}</a>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = 'Next player: ' + (this.state.blackIsNext ? BLACK_STONE : WHITE_STONE);
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(x, y) => this.handleClick(x, y)} />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares) {
  return;
}

function reverseStones(x, y, putStone, squares) {
  let reversed = 0;

  // left
  if (x !== 0 && squares[y][x - 1] && squares[y][x - 1] !== putStone) {
    reversed += reverseLeft(x - 1, y, putStone, squares);
  }
  // right
  if (x !== BOARD_WIDTH - 1 && squares[y][x + 1] && squares[y][x + 1] !== putStone) {
    reversed += reverseRight(x + 1, y, putStone, squares);
  }
  // up
  if (y !== 0 && squares[y - 1][x] && squares[y - 1][x] !== putStone) {
    reversed += reverseUp(x, y - 1, putStone, squares);
  }
  // down
  if (y !== BOARD_HEIGHT - 1 && squares[y + 1][x] && squares[y + 1][x] !== putStone) {
    reversed += reverseDown(x, y + 1, putStone, squares);
  }
  // left up
  if (x !== 0 && y !== 0 && squares[y - 1][x - 1] && squares[y - 1][x - 1] !== putStone) {
    reversed += reverseLeftUp(x - 1, y - 1, putStone, squares);
  }
  // right up
  if (x !== BOARD_WIDTH - 1 && y !== 0 && squares[y - 1][x + 1] && squares[y - 1][x + 1] !== putStone) {
    reversed += reverseRightUp(x + 1, y - 1, putStone, squares);
  }
  // right down
  if (x !== BOARD_WIDTH - 1 && y !== BOARD_HEIGHT - 1 && squares[y + 1][x + 1] && squares[y + 1][x + 1] !== putStone) {
    reversed += reverseRightDown(x + 1, y + 1, putStone, squares);
  }
  // left down
  if (x !== 0 && y !== BOARD_HEIGHT - 1 && squares[y + 1][x - 1] && squares[y + 1][x - 1] !== putStone) {
    reversed += reverseLeftDown(x - 1, y + 1, putStone, squares);
  }

  return reversed;
}

function reverseLeft(x, y, putStone, squares) {
  if (x <= 0 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y][x - 1] && squares[y][x - 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseLeft(x - 1, y, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseRight(x, y, putStone, squares) {
  if (x >= BOARD_WIDTH - 1 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y][x + 1] && squares[y][x + 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseRight(x + 1, y, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseUp(x, y, putStone, squares) {
  if (y <= 0 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y - 1][x] && squares[y - 1][x] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseUp(x, y - 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseDown(x, y, putStone, squares) {
  if (y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y + 1][x] && squares[y + 1][x] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseDown(x, y + 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseLeftUp(x, y, putStone, squares) {
  if (x <= 0 || y <= 0 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y - 1][x - 1] && squares[y - 1][x - 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseLeftUp(x - 1, y - 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseRightUp(x, y, putStone, squares) {
  if (x >= BOARD_WIDTH - 1 || y <= 0 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y - 1][x + 1] && squares[y - 1][x + 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseRightUp(x + 1, y - 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseRightDown(x, y, putStone, squares) {
  if (x >= BOARD_WIDTH - 1 || y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y + 1][x + 1] && squares[y + 1][x + 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseRightDown(x + 1, y + 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}

function reverseLeftDown(x, y, putStone, squares) {
  if (x <= 0 || y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone) {
    return 0;
  }
  if (squares[y + 1][x - 1] && squares[y + 1][x - 1] === putStone) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    return 1;
  }

  let reversed = reverseLeftDown(x - 1, y + 1, putStone, squares);
  if (reversed > 0) {
    squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    reversed++;
  }
  return reversed;
}
