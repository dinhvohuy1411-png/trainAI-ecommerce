import React from 'react';

const QuantitySelector = ({ value, min = 1, max, onChange }) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= min && (!max || newValue <= max)) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', width: 'fit-content' }}>
      {/* Nút Giảm */}
      <button 
        onClick={handleDecrease}
        disabled={value <= min}
        style={{
          width: '30px',
          height: '30px',
          border: 'none',
          borderRight: '1px solid #ddd',
          backgroundColor: '#fff',
          cursor: value <= min ? 'not-allowed' : 'pointer',
          color: '#555',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: '4px',
          borderBottomLeftRadius: '4px'
        }}
      >
        -
      </button>

      {/* Ô Input */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        style={{
          width: '40px',
          height: '30px',
          border: 'none',
          textAlign: 'center',
          fontSize: '14px',
          outline: 'none',
          color: '#333'
        }}
      />

      {/* Nút Tăng */}
      <button 
        onClick={handleIncrease}
        disabled={max && value >= max}
        style={{
          width: '30px',
          height: '30px',
          border: 'none',
          borderLeft: '1px solid #ddd',
          backgroundColor: '#fff',
          cursor: (max && value >= max) ? 'not-allowed' : 'pointer',
          color: '#555',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '4px'
        }}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;