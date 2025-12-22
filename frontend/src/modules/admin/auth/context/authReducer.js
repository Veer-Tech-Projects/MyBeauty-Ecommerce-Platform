export const initialState = {
  status: 'LOADING', // 'IDLE' | 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR'
  admin: null,       // AdminSession object
  error: null,
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, status: 'LOADING', error: null };
    
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        status: 'AUTHENTICATED', 
        admin: action.payload, 
        error: null 
      };

    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        status: 'UNAUTHENTICATED', 
        admin: null, 
        error: action.payload 
      };

    case 'LOGOUT':
      return { ...state, status: 'UNAUTHENTICATED', admin: null, error: null };

    case 'SESSION_ERROR':
      // Differentiate between 401 (Unauth) and 500/Network (Error)
      return {
        ...state,
        status: 'ERROR',
        error: action.payload,
        // Keep admin if it's just a network blip? No, safer to clear for admin panel.
        admin: null
      };

    default:
      return state;
  }
};