
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeamAllView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/agent-admin');
  }, [navigate]);

  return null;
};

export default TeamAllView;
