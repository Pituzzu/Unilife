
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

const { Navigate } = ReactRouterDOM as any;

const Register: React.FC = () => {
  return <Navigate to="/login" />;
};

export default Register;
