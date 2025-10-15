// Delete Confirm Modal Component

import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, transitions } from '../../styles';
import { logger } from '../../utils/logger';

interface DeleteConfirmModalProps {
  locationId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationId: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  locationId,
  locationName,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      logger.info('Confirming location deletion', { locationId, locationName });

      await onConfirm(locationId);

      logger.userAction('Location deleted successfully', { locationId, locationName });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location';
      setError(errorMessage);
      logger.error('Failed to delete location', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>장소 삭제</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <WarningIcon>⚠️</WarningIcon>
          <WarningTitle>정말로 삭제하시겠습니까?</WarningTitle>
          <WarningMessage>
            <strong>{locationName}</strong> 장소를 삭제합니다.<br />
            이 작업은 되돌릴 수 없습니다.
          </WarningMessage>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ModalBody>

        <ModalFooter>
          <CancelButton type="button" onClick={onClose} disabled={isDeleting}>
            취소
          </CancelButton>
          <DeleteButton onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? '삭제 중...' : '삭제'}
          </DeleteButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: ${colors.shadow.lg};
  max-width: 400px;
  width: 100%;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${colors.text.tertiary};
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    color: ${colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const WarningIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 0.75rem;
`;

const WarningTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0 0 0.75rem 0;
`;

const WarningMessage = styled.p`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  line-height: 1.5;
  margin: 0;

  strong {
    color: ${colors.text.primary};
    font-weight: 600;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: #FFF5F5;
  border: 1px solid ${colors.status.error};
  border-radius: 4px;
  color: ${colors.status.error};
  font-size: 0.8125rem;
  margin-top: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
  background-color: white;
  color: ${colors.text.primary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${colors.surface.hover};
    border-color: ${colors.text.tertiary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: ${colors.status.error};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover:not(:disabled) {
    background-color: #E53E3E;
  }

  &:disabled {
    background-color: ${colors.border.primary};
    cursor: not-allowed;
  }
`;
