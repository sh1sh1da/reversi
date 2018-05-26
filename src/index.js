import React from 'react';
import ReactDOM from 'react-dom';
import io from "socket.io-client";
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

    this.socket = io('http://ec2-54-238-130-21.ap-northeast-1.compute.amazonaws.com:8080');

    this.sendMessage = (state) => {
      this.socket.emit('SEND_MESSAGE', {
        state: state
      });
    }

    this.socket.on('RECEIVE_MESSAGE', function (state) {
      if (state !== null) {
        this.setState(state);
      }
    }.bind(this));
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
    const reversed = reverseStones(x, y, putStone, squares, false);
    if (reversed == 0) {
      return;
    }

    squares[y][x] = this.state.blackIsNext ? BLACK_STONE : WHITE_STONE;

    const updatedState = {
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      blackIsNext: !this.state.blackIsNext,
    };
    this.setState(updatedState);
    this.sendMessage(updatedState);
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      blackIsNext: (step % 2) === 0,
    })
  }

  reset() {
    const squares = Array.from(new Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill(null));
    squares[3][3] = WHITE_STONE;
    squares[3][4] = BLACK_STONE;
    squares[4][3] = BLACK_STONE;
    squares[4][4] = WHITE_STONE;

    const initialState = {
      history: [{
        squares: squares
      }],
      stepNumber: 0,
      blackIsNext: true,
    };

    this.setState(initialState);
    this.sendMessage(initialState);
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];

    const currentStone = this.state.blackIsNext ? BLACK_STONE : WHITE_STONE;
    const nextStone = this.state.blackIsNext ? WHITE_STONE : BLACK_STONE;
    let isGameOver = false;
    if (!isPuttable(current.squares, currentStone)) {
      if (!isPuttable(current.squares, nextStone)) {
        isGameOver = true;
      } else {
        // pass
        this.state.blackIsNext = !this.state.blackIsNext;
      }
    }

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
    if (isGameOver) {
      let nBlacks = 0;
      let nWhites = 0;

      for (let y = 0; y < current.squares.length; y++) {
        for (let x = 0; x < current.squares[y].length; x++) {
          if (current.squares[y][x] === BLACK_STONE) {
            nBlacks++;
          } else if (current.squares[y][x] === WHITE_STONE) {
            nWhites++;
          }
        }
      }

      let winner;
      if (nBlacks === nWhites) {
        winner = "Draw!";
      } else if (nBlacks > nWhites) {
        winner = BLACK_STONE;
      } else if (nBlacks < nWhites) {
        winner = WHITE_STONE;
      }

      status = 'Winner: ' + winner + ' （ ' + BLACK_STONE + ' ' + nBlacks + ' ' + WHITE_STONE + ' ' + nWhites + ' ） ';
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

        <button onClick={() => this.reset()}>Reset</button>

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
  let nBlacks = 0;
  let nWhites = 0;

  for (let y = 0; y < squares.length; y++) {
    for (let x = 0; x < squares[y].length; x++) {
      if (squares[y][x] === BLACK_STONE) {
        nBlacks++;
      } else if (squares[y][x] === WHITE_STONE) {
        nWhites++;
      }
    }
  }

  return BLACK_STONE;
}

function isPuttable(squares, putStone) {
  for (let y = 0; y < squares.length; y++) {
    for (let x = 0; x < squares[y].length; x++) {
      if (squares[y][x] !== null) {
        continue;
      }
      const reversibleStones = reverseStones(x, y, putStone, squares, true);
      if (reversibleStones > 0) {
        return true;
      }
    }
  }
  return false;
}

function reverseStones(x, y, putStone, squares, isCheckOnly) {
  let reversed = 0;

  // left
  if (x !== 0 && squares[y][x - 1] && squares[y][x - 1] !== putStone) {
    reversed += reverseLeft(x - 1, y, putStone, squares, isCheckOnly);
  }
  // right
  if (x !== BOARD_WIDTH - 1 && squares[y][x + 1] && squares[y][x + 1] !== putStone) {
    reversed += reverseRight(x + 1, y, putStone, squares, isCheckOnly);
  }
  // up
  if (y !== 0 && squares[y - 1][x] && squares[y - 1][x] !== putStone) {
    reversed += reverseUp(x, y - 1, putStone, squares, isCheckOnly);
  }
  // down
  if (y !== BOARD_HEIGHT - 1 && squares[y + 1][x] && squares[y + 1][x] !== putStone) {
    reversed += reverseDown(x, y + 1, putStone, squares, isCheckOnly);
  }
  // left up
  if (x !== 0 && y !== 0 && squares[y - 1][x - 1] && squares[y - 1][x - 1] !== putStone) {
    reversed += reverseLeftUp(x - 1, y - 1, putStone, squares, isCheckOnly);
  }
  // right up
  if (x !== BOARD_WIDTH - 1 && y !== 0 && squares[y - 1][x + 1] && squares[y - 1][x + 1] !== putStone) {
    reversed += reverseRightUp(x + 1, y - 1, putStone, squares, isCheckOnly);
  }
  // right down
  if (x !== BOARD_WIDTH - 1 && y !== BOARD_HEIGHT - 1 && squares[y + 1][x + 1] && squares[y + 1][x + 1] !== putStone) {
    reversed += reverseRightDown(x + 1, y + 1, putStone, squares, isCheckOnly);
  }
  // left down
  if (x !== 0 && y !== BOARD_HEIGHT - 1 && squares[y + 1][x - 1] && squares[y + 1][x - 1] !== putStone) {
    reversed += reverseLeftDown(x - 1, y + 1, putStone, squares, isCheckOnly);
  }

  return reversed;
}

function reverseLeft(x, y, putStone, squares, isCheckOnly) {
  if (x <= 0 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y][x - 1] && squares[y][x - 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseLeft(x - 1, y, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseRight(x, y, putStone, squares, isCheckOnly) {
  if (x >= BOARD_WIDTH - 1 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y][x + 1] && squares[y][x + 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseRight(x + 1, y, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseUp(x, y, putStone, squares, isCheckOnly) {
  if (y <= 0 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y - 1][x] && squares[y - 1][x] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseUp(x, y - 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseDown(x, y, putStone, squares, isCheckOnly) {
  if (y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y + 1][x] && squares[y + 1][x] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseDown(x, y + 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseLeftUp(x, y, putStone, squares, isCheckOnly) {
  if (x <= 0 || y <= 0 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y - 1][x - 1] && squares[y - 1][x - 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseLeftUp(x - 1, y - 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseRightUp(x, y, putStone, squares, isCheckOnly) {
  if (x >= BOARD_WIDTH - 1 || y <= 0 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y - 1][x + 1] && squares[y - 1][x + 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseRightUp(x + 1, y - 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseRightDown(x, y, putStone, squares, isCheckOnly) {
  if (x >= BOARD_WIDTH - 1 || y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y + 1][x + 1] && squares[y + 1][x + 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseRightDown(x + 1, y + 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}

function reverseLeftDown(x, y, putStone, squares, isCheckOnly) {
  if (x <= 0 || y >= BOARD_HEIGHT - 1 || squares[y][x] === putStone || squares[y][x] === null) {
    return 0;
  }
  if (squares[y + 1][x - 1] && squares[y + 1][x - 1] === putStone) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    return 1;
  }

  let reversed = reverseLeftDown(x - 1, y + 1, putStone, squares, isCheckOnly);
  if (reversed > 0) {
    if (!isCheckOnly) {
      squares[y][x] = (putStone === BLACK_STONE ? BLACK_STONE : WHITE_STONE);
    }
    reversed++;
  }
  return reversed;
}
