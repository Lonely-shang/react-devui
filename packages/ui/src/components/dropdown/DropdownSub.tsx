import { useRef, useState } from 'react';

import { usePrefixConfig, useTranslation, useEventCallback, useElement, useMaxIndex } from '../../hooks';
import { RightOutlined } from '../../icons';
import { getClassName, getHorizontalSidePosition, getNoTransformSize } from '../../utils';
import { DPopup } from '../_popup';
import { DTransition } from '../_transition';

export interface DDropdownSubProps {
  children: React.ReactNode;
  dId: string;
  dFocusVisible: boolean;
  dPopup: React.ReactNode;
  dPopupVisible: boolean;
  dPopupState: boolean;
  dEmpty: boolean;
  dTrigger: 'hover' | 'click';
  dIcon?: React.ReactNode;
  dLevel?: number;
  dDisabled?: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const TTANSITION_DURING = 116;
export function DDropdownSub(props: DDropdownSubProps): JSX.Element | null {
  const {
    children,
    dId,
    dFocusVisible,
    dPopup,
    dPopupVisible,
    dPopupState,
    dEmpty,
    dTrigger,
    dIcon,
    dLevel = 0,
    dDisabled,
    onVisibleChange,
  } = props;

  //#region Context
  const dPrefix = usePrefixConfig();
  //#endregion

  //#region Ref
  const ulRef = useRef<HTMLUListElement>(null);
  const liRef = useRef<HTMLLIElement>(null);
  //#endregion

  const [t] = useTranslation('Common');

  const containerEl = useElement(() => {
    let el = document.getElementById(`${dPrefix}dropdown-root`);
    if (!el) {
      el = document.createElement('div');
      el.id = `${dPrefix}dropdown-root`;
      document.body.appendChild(el);
    }
    return el;
  });

  const [popupPositionStyle, setPopupPositionStyle] = useState<React.CSSProperties>({
    top: -9999,
    left: -9999,
  });
  const [transformOrigin, setTransformOrigin] = useState<string>();
  const updatePosition = useEventCallback(() => {
    if (ulRef.current && liRef.current) {
      const { width, height } = getNoTransformSize(ulRef.current);
      const { top, left, transformOrigin } = getHorizontalSidePosition(liRef.current, { width, height }, 'right', 10);
      setPopupPositionStyle({
        top,
        left,
      });
      setTransformOrigin(transformOrigin);
    }
  });

  const maxZIndex = useMaxIndex(dPopupVisible);

  return (
    <DTransition dIn={dPopupVisible} dDuring={TTANSITION_DURING} onEnterRendered={updatePosition}>
      {(state) => {
        let transitionStyle: React.CSSProperties = {};
        switch (state) {
          case 'enter':
            transitionStyle = { transform: 'scale(0)', opacity: 0 };
            break;

          case 'entering':
            transitionStyle = {
              transition: `transform ${TTANSITION_DURING}ms ease-out, opacity ${TTANSITION_DURING}ms ease-out`,
              transformOrigin,
            };
            break;

          case 'leaving':
            transitionStyle = {
              transform: 'scale(0)',
              opacity: 0,
              transition: `transform ${TTANSITION_DURING}ms ease-in, opacity ${TTANSITION_DURING}ms ease-in`,
              transformOrigin,
            };
            break;

          case 'leaved':
            transitionStyle = { display: 'none' };
            break;

          default:
            break;
        }

        return (
          <DPopup
            dDisabled={dDisabled}
            dVisible={dPopupState}
            dPopup={({ pOnClick, pOnMouseEnter, pOnMouseLeave, ...restPCProps }) => (
              <ul
                {...restPCProps}
                ref={ulRef}
                className={`${dPrefix}dropdown-sub__list`}
                style={{
                  ...popupPositionStyle,
                  ...transitionStyle,
                  zIndex: maxZIndex,
                }}
                role="menu"
                aria-labelledby={dId}
                onClick={() => {
                  pOnClick?.();
                }}
                onMouseEnter={() => {
                  pOnMouseEnter?.();
                }}
                onMouseLeave={() => {
                  pOnMouseLeave?.();
                }}
              >
                {dEmpty ? (
                  <div className={`${dPrefix}dropdown-sub__empty`} style={{ paddingLeft: 12 + dLevel * 16 }}>
                    {t('No Data')}
                  </div>
                ) : (
                  dPopup
                )}
              </ul>
            )}
            dContainer={containerEl}
            dTrigger={dTrigger}
            onVisibleChange={onVisibleChange}
            onUpdate={updatePosition}
          >
            {({ pOnClick, pOnFocus, pOnBlur, pOnMouseEnter, pOnMouseLeave, ...restPCProps }) => (
              <li
                {...restPCProps}
                ref={liRef}
                id={dId}
                className={getClassName(`${dPrefix}dropdown-sub`, {
                  'is-expand': dPopupVisible,
                  'is-disabled': dDisabled,
                })}
                style={{ paddingLeft: 12 + dLevel * 16 }}
                role="menuitem"
                aria-haspopup={true}
                aria-expanded={dPopupVisible}
                aria-disabled={dDisabled}
                onClick={() => {
                  pOnClick?.();
                }}
                onFocus={() => {
                  pOnFocus?.();
                }}
                onBlur={() => {
                  pOnBlur?.();
                }}
                onMouseEnter={() => {
                  pOnMouseEnter?.();
                }}
                onMouseLeave={() => {
                  pOnMouseLeave?.();
                }}
              >
                {dFocusVisible && <div className={`${dPrefix}focus-outline`}></div>}
                {dIcon && <div className={`${dPrefix}dropdown-sub__icon`}>{dIcon}</div>}
                <div className={`${dPrefix}dropdown-sub__title`}>{children}</div>
                <RightOutlined className={`${dPrefix}dropdown-sub__arrow`} dSize={14} />
              </li>
            )}
          </DPopup>
        );
      }}
    </DTransition>
  );
}
