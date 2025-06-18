import React from "react";

const UserSelect = ({ users, selected, onChange }) => {
  return (
    <div className="user-select">
      <label>Select User</label>
      <select
        className="user-select-dropdown"
        value={selected}
        onChange={(e) => {
          const val = e.target.value;
          console.log("Selected user:", val);
          onChange(val);
        }}
      >
        <option value="">-- Select a user --</option>
        {users.map((user) => (
          <option key={user.user_id} value={user.user_id}>
            {user.name || user.email}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UserSelect;
