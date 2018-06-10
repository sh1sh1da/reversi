import React from 'react';

class LoggedInUserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { users: [] }
    props.socket.on('LOGGED_IN_USERS', users => {
      this.setState({ users: users });
    });
  }

  render() {
    const generateUserList = () => {
      let userList = [];
      for (const user of this.state.users) {
        userList.push(user);
      }
      return userList.map(u => <li>{u}</li>);
    };

    return (
      <div>
        <strong>ログイン中のユーザー</strong>
        <ul>
          {generateUserList()}
        </ul>
      </div>
    );
  }
}

export default LoggedInUserList
