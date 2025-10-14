// Create Location Modal Component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCategories } from '../../../stores/category';
import { useLocationStore } from '../../../stores/location';
import { logger } from '../../../utils/logger';
import type { CreateLocationRequest } from '../../../types';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
  initialPosition
}) => {
  const categories = useCategories();
  const createLocation = useLocationStore((state) => state.createLocation);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    lat: initialPosition?.lat || 0,
    lng: initialPosition?.lng || 0,
    address: initialPosition?.address || '',
    rating: 0,
    review: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initialPosition 변경 시 formData 업데이트
  useEffect(() => {
    if (initialPosition) {
      setFormData(prev => ({
        ...prev,
        lat: initialPosition.lat,
        lng: initialPosition.lng,
        address: initialPosition.address || ''
      }));
    }
  }, [initialPosition?.lat, initialPosition?.lng, initialPosition?.address]);

  // Modal이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        lat: initialPosition?.lat || 0,
        lng: initialPosition?.lng || 0,
        address: initialPosition?.address || '',
        rating: 0,
        review: ''
      });
      setError(null);
    }
  }, [isOpen, initialPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!formData.name.trim()) {
      setError('장소 이름을 입력해주세요.');
      return;
    }

    if (!formData.categoryId) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const requestData: CreateLocationRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        latitude: formData.lat,
        longitude: formData.lng,
        address: formData.address.trim() || undefined,
        rating: formData.rating > 0 ? formData.rating : undefined,  // 백엔드는 'rating'으로 받음
        review: formData.review.trim() || undefined  // 백엔드는 'review'로 받음
      };

      await createLocation(requestData);
      logger.userAction('Location created successfully', { name: formData.name });
      onClose();
    } catch (err) {
      logger.error('Failed to create location', err);
      setError(err instanceof Error ? err.message : '장소 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId }));
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>새 장소 추가</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label htmlFor="name">장소 이름 *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 스타벅스 강남점"
              disabled={isSubmitting}
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleCategorySelect(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.displayName}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="address">주소 (선택)</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="주소를 입력하세요"
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="장소에 대한 설명을 입력하세요"
              rows={3}
              disabled={isSubmitting}
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
                      onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, rating: star - 0.5 }))}
                      disabled={isSubmitting}
                      title={`${star - 0.5}점`}
                    />
                    <ClickableRight
                      type="button"
                      onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, rating: star }))}
                      disabled={isSubmitting}
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
                  onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, rating: 0 }))}
                  disabled={isSubmitting}
                >
                  초기화
                </RatingReset>
              )}
            </RatingContainer>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="review">개인 리뷰 (선택)</Label>
            <Textarea
              id="review"
              value={formData.review}
              onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
              placeholder="이 장소에 대한 개인적인 의견을 남겨주세요"
              rows={3}
              disabled={isSubmitting}
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose} disabled={isSubmitting}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? '추가 중...' : '추가'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContainer>
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
  z-index: 2000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #4a5568;
  }
`;

const Form = styled.form`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  &:disabled {
    background-color: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #cbd5e0;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  &:disabled {
    background-color: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #2d3748;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  &:disabled {
    background-color: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #cbd5e0;
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
  padding: 12px;
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f7fafc;
  color: #4a5568;

  &:hover:not(:disabled) {
    background-color: #edf2f7;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #3182ce;
  color: white;

  &:hover:not(:disabled) {
    background-color: #2c5aa0;
  }
`;
