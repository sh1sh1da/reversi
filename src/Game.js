import React from 'react';
import io from 'socket.io-client';
import LoggedInUserList from './LoggedInUserList';
import LoginForm from './LoginForm';
import Board from './Board';
import './index.css';

const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;
const BLACK_STONE = '●';
const WHITE_STONE = '○';

class Game extends React.Component {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
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
    if (!this.state.loggedIn) {
      return;
    }

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
    if (reversed === 0) {
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

  login(e, value) {
    e.preventDefault();
    if (value === '') return;
    this.state.loggedIn = true;
    this.setState(this.state);
    this.socket.emit('LOGIN', { name: value }, (response) => {
      if (response.errorMessage) {
        this.state.loggedIn = false;
        this.setState(this.state);
        console.log(response);
      }
    });
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

    const display = () => ({
      display: this.state.loggedIn ? 'none' : 'block'
    });

    return (
      <div className="game">
        <div style={display()} className="login-form">
          <LoginForm onClick={(e, value) => this.login(e, value)} />
        </div>
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(x, y) => this.handleClick(x, y)} />
        </div>

        <button onClick={() => this.reset()}>Reset</button>

        <LoggedInUserList socket={this.socket} />

        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

export default Game

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
