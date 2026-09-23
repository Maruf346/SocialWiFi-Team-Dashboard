const STORAGE_KEY = 'rightroute_admin_users_v4';

export const permissionGroups = [
  {
    title: 'Admin',
    items: ['Admin user list', 'Add admin user'],
  },
  {
    title: 'Team Users',
    items: ['Manage'],
  },
  {
    title: 'My Plan',
    items: ['Manage'],
  },
  {
    title: 'Route History',
    items: ['My route history'],
  },
  {
    title: 'Legal',
    items: ['Privacy Policy', 'Terms of Use', 'Disclaimer'],
  },
  {
    title: 'Support',
    items: ['Contact support', 'Help center', 'Submit a support ticket', 'Resources'],
  },
  {
    title: 'Security, Logging & Compliance',
    items: ['Logout', 'Data protection', 'Delete account'],
  },
];

// Helper to create unique permission identifier
export const getPermissionKey = (groupTitle, item) => `${groupTitle}::${item}`;

export const initialAdminUsers = [
  {
    id: 'USR-1001',
    name: 'John Doe',
    role: 'Super Admin',
    email: 'johnd@gmail.com',
    phone: '701-555-1234',
    status: 'Allowed',
    isSuperAdmin: true,
    permissions: permissionGroups.flatMap((group) =>
      group.items.map((item) => getPermissionKey(group.title, item))
    ),
  },
  {
    id: 'USR-1785',
    name: 'Suzy Cue',
    role: 'User Mgmt',
    email: 'suzy@gmail.com',
    phone: '612-123-4567',
    status: 'Allowed',
    isSuperAdmin: false,
    permissions: [
      getPermissionKey('Admin', 'Admin user list'),
      getPermissionKey('Admin', 'Add admin user'),
      getPermissionKey('Team Users', 'Manage'),
    ],
  },
  {
    id: 'USR-1513',
    name: 'G. I. Joe',
    role: 'User Mgmt',
    email: 'gjoe@gmail.com',
    phone: '612-123-4567',
    status: 'Locked',
    isSuperAdmin: false,
    permissions: [getPermissionKey('Admin', 'Admin user list')],
  },
  {
    id: 'USR-2549',
    name: 'Tom Thumb',
    role: 'Route Auditor',
    email: 'tom@gmail.com',
    phone: '612-123-4567',
    status: 'Allowed',
    isSuperAdmin: false,
    permissions: [getPermissionKey('Route History', 'My route history')],
  },
  {
    id: 'USR-3001',
    name: 'Jane Smith',
    role: 'Route Auditor',
    email: 'janesmith@gmail.com',
    phone: '612-123-4567',
    status: 'Allowed',
    isSuperAdmin: false,
    permissions: [getPermissionKey('Route History', 'My route history')],
  },
  {
    id: 'USR-4002',
    name: 'Bob Johnson',
    role: 'User Mgmt',
    email: 'bobjohnson@gmail.com',
    phone: '612-123-4567',
    status: 'Allowed',
    isSuperAdmin: false,
    permissions: [getPermissionKey('Team Users', 'Manage')],
  },
  {
    id: 'USR-5003',
    name: 'Alice Williams',
    role: 'Route Auditor',
    email: 'alicewilliams@gmail.com',
    phone: '612-123-4567',
    status: 'Allowed',
    isSuperAdmin: false,
    permissions: [getPermissionKey('Route History', 'My route history')],
  },
];

export const getAdminUsers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAdminUsers));
      return initialAdminUsers;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAdminUsers));
      return initialAdminUsers;
    }
    return parsed;
  } catch {
    return initialAdminUsers;
  }
};

export const saveAdminUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save admin users to localStorage', err);
  }
};

export const addAdminUser = (userData) => {
  const users = getAdminUsers();
  const randomId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser = {
    id: userData.id || randomId,
    name: userData.name || 'New Admin',
    role: userData.role || 'User Mgmt',
    email: userData.email || '',
    phone: userData.phone || '',
    status: userData.status || 'Allowed',
    isSuperAdmin: Boolean(userData.isSuperAdmin),
    permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
  };
  const updatedUsers = [...users, newUser];
  saveAdminUsers(updatedUsers);
  return newUser;
};

export const updateAdminUser = (id, updatedFields) => {
  const users = getAdminUsers();
  const updatedUsers = users.map((user) => {
    if (user.id !== id) return user;
    return {
      ...user,
      ...updatedFields,
      permissions: Array.isArray(updatedFields.permissions)
        ? updatedFields.permissions
        : user.permissions || [],
    };
  });
  saveAdminUsers(updatedUsers);
  return updatedUsers;
};

export const deleteAdminUsers = (ids) => {
  const users = getAdminUsers();
  const updatedUsers = users.filter((user) => !ids.includes(user.id));
  saveAdminUsers(updatedUsers);
  return updatedUsers;
};

export const lockAdminUsers = (ids) => {
  const users = getAdminUsers();
  const updatedUsers = users.map((user) =>
    ids.includes(user.id) ? { ...user, status: 'Locked' } : user
  );
  saveAdminUsers(updatedUsers);
  return updatedUsers;
};

export const unlockAdminUsers = (ids) => {
  const users = getAdminUsers();
  const updatedUsers = users.map((user) =>
    ids.includes(user.id) ? { ...user, status: 'Allowed' } : user
  );
  saveAdminUsers(updatedUsers);
  return updatedUsers;
};

export const getAdminUserById = (id) => {
  const users = getAdminUsers();
  return users.find((user) => user.id === id) || null;
};
