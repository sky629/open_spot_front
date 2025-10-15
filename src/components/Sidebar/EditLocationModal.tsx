// Edit Location Modal Component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCategories } from '../../stores/category';
import { colors, transitions } from '../../styles';
import { logger } from '../../utils/logger';
import type { LocationResponse, UpdateLocationRequest } from '../../types';

interface EditLocationModalProps {
  location: LocationResponse;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: UpdateLocationRequest) => Promise<void>;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  location,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const categories = useCategories();
  const [formData, setFormData] = useState({
    name: location.name || '',
    description: location.description || '',
    address: location.address || '',
    categoryId: location.category || '',
    rating: location.rating || 0,
    review: location.review || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: location.name || '',
        description: location.description || '',
        address: location.address || '',
        categoryId: location.category || '',
        rating: location.rating || 0,
        review: location.review || '',
      });
      setError(null);
    }
  }, [isOpen, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('장소 이름을 입력해주세요');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      logger.info('Submitting location update', { locationId: location.id, formData });

      const requestData: UpdateLocationRequest = {
        id: location.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        rating: formData.rating > 0 ? formData.rating : undefined,
        review: formData.review.trim() || undefined,
      };

      await onSubmit(requestData);

      logger.userAction('Location updated successfully', { locationId: location.id });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      logger.error('Failed to update location', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>장소 수정</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">장소 이름 *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="장소 이름을 입력하세요"
                maxLength={100}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="categoryId">카테고리</Label>
              <Select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
              >
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.displayName}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="address">주소</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="주소를 입력하세요"
                maxLength={200}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="장소에 대한 설명을 입력하세요"
                maxLength={1000}
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="rating">개인 평점 (선택)</Label>
              <RatingContainer>
                {[1, 2, 3, 4, 5].map(star => {
                  const rating = formData.rating;
                  const isFull = star <= rating;
                  const isHalf = star - 0.5 === rating;

                  return (
                    <StarWrapper key={star}>
                      <StarBackground>★</StarBackground>
                      {(isFull || isHalf) && (
                        <StarFilled $half={isHalf}>★</StarFilled>
                      )}
                      <ClickableLeft
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating: star - 0.5 }))}
                        title={`${star - 0.5}점`}
                      />
                      <ClickableRight
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                        title={`${star}점`}
                      />
                    </StarWrapper>
                  );
                })}
                {formData.rating > 0 && (
                  <RatingInfo>
                    {formData.rating}점
                  </RatingInfo>
                )}
                {formData.rating > 0 && (
                  <RatingReset
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))}
                  >
                    초기화
                  </RatingReset>
                )}
              </RatingContainer>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="review">내 리뷰</Label>
              <Textarea
                id="review"
                name="review"
                value={formData.review}
                onChange={handleInputChange}
                placeholder="이 장소에 대한 리뷰를 작성하세요"
                maxLength={2000}
                rows={4}
              />
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ModalFooter>
              <CancelButton type="button" onClick={onClose} disabled={isSubmitting}>
                취소
              </CancelButton>
              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? '수정 중...' : '수정하기'}
              </SubmitButton>
            </ModalFooter>
          </Form>
        </ModalBody>
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${colors.text.primary};
  transition: ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 2px ${colors.primary.subtle};
  }

  &::placeholder {
    color: ${colors.text.tertiary};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${colors.text.primary};
  resize: vertical;
  font-family: inherit;
  transition: ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 2px ${colors.primary.subtle};
  }

  &::placeholder {
    color: ${colors.text.tertiary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${colors.text.primary};
  background-color: white;
  cursor: pointer;
  transition: ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 2px ${colors.primary.subtle};
  }
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StarWrapper = styled.div`
  position: relative;
  display: inline-block;
  font-size: 2rem;
  line-height: 1;
  margin: 0 2px;
`;

const StarBackground = styled.span`
  color: #e5e7eb;
  user-select: none;
  pointer-events: none;
`;

const StarFilled = styled.span<{ $half: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  color: #fbbf24;
  user-select: none;
  pointer-events: none;
  overflow: hidden;
  width: ${props => props.$half ? '50%' : '100%'};
  transition: width 0.2s ease;
`;

const ClickableLeft = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1;

  &:hover {
    background: rgba(251, 191, 36, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ClickableRight = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1;

  &:hover {
    background: rgba(251, 191, 36, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const RatingInfo = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-left: 8px;
`;

const RatingReset = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 8px;
  text-decoration: underline;
  margin-left: 4px;

  &:hover:not(:disabled) {
    color: #374151;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: #FFF5F5;
  border: 1px solid ${colors.status.error};
  border-radius: 4px;
  color: ${colors.status.error};
  font-size: 0.8125rem;
  margin-bottom: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${colors.border.secondary};
  margin-top: 1rem;
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

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: ${colors.primary.main};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${colors.primary.dark};
  }

  &:disabled {
    background-color: ${colors.border.primary};
    cursor: not-allowed;
  }
`;
