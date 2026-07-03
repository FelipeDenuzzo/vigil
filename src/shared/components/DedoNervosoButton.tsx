import React, { useState } from 'react';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';

interface DedoNervosoButtonProps extends React.ComponentProps<typeof Button> {
  onConfirm: () => void;
}

export const DedoNervosoButton: React.FC<DedoNervosoButtonProps> = ({
  onConfirm,
  onClick,
  children,
  ...props
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // Intercepta o clique para mostrar o modal do Dedo Nervoso sempre
    setShowModal(true);
    
    // Se o componente pai passou um onClick (além do onConfirm obrigatório), chama ele também,
    // mas geralmente o onConfirm já cobre a lógica de avanço.
    if (onClick) {
      onClick(e);
    }
  };

  const handleConfirm = () => {
    setShowModal(false);
    onConfirm();
  };

  return (
    <>
      <Button onClick={handleClick} {...props}>
        {children}
      </Button>
      
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
