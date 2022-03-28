import type { DSize } from '../../types';

import React, { useRef } from 'react';

import { usePrefixConfig, useComponentConfig, useWave, useGeneralState } from '../../hooks';
import { LoadingOutlined } from '../../icons';
import { registerComponentMate, getClassName } from '../../utils';
import { DCollapseTransition } from '../_transition';
import { useCompose } from '../compose';

export type DButtonRef = HTMLButtonElement;

export interface DButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  dType?: 'primary' | 'secondary' | 'outline' | 'dashed' | 'text' | 'link';
  dTheme?: 'primary' | 'success' | 'warning' | 'danger';
  dLoading?: boolean;
  dBlock?: boolean;
  dShape?: 'circle' | 'round';
  dSize?: DSize;
  dIcon?: React.ReactNode;
  dIconRight?: boolean;
}

const TTANSITION_DURING = 300;
const { COMPONENT_NAME } = registerComponentMate({ COMPONENT_NAME: 'DButton' });
function Button(props: DButtonProps, ref: React.ForwardedRef<DButtonRef>) {
  const {
    children,
    dType = 'primary',
    dTheme = 'primary',
    dLoading = false,
    dBlock = false,
    dShape,
    dSize,
    dIcon,
    dIconRight = false,

    className,
    type = 'button',
    disabled: _disabled,
    onClick,
    ...restProps
  } = useComponentConfig(COMPONENT_NAME, props);

  //#region Context
  const dPrefix = usePrefixConfig();
  const { gSize, gDisabled } = useGeneralState();
  //#endregion

  //#region Ref
  const iconRef = useRef<HTMLDivElement>(null);
  //#endregion

  const [waveNode, wave] = useWave();

  const size = dSize ?? gSize;
  const disabled = _disabled || dLoading || gDisabled;

  const buttonIcon = (loading: boolean, style?: React.CSSProperties) => (
    <div
      ref={iconRef}
      className={getClassName(`${dPrefix}button__icon`, {
        [`${dPrefix}button__icon--right`]: dIconRight,
      })}
      style={style}
    >
      {loading ? <LoadingOutlined dSpin /> : dIcon}
    </div>
  );

  const composeDataAttrs = useCompose(false, disabled);

  return (
    <button
      {...restProps}
      {...composeDataAttrs}
      ref={ref}
      className={getClassName(className, `${dPrefix}button`, `${dPrefix}button--${dType}`, `t-${dTheme}`, {
        [`${dPrefix}button--${dShape}`]: dShape,
        [`${dPrefix}button--${size}`]: size,
        [`${dPrefix}button--block`]: dBlock,
        [`${dPrefix}button--icon`]: !children,
        'is-loading': dLoading,
      })}
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={(e) => {
        onClick?.(e);

        if (dType === 'primary' || dType === 'secondary' || dType === 'outline' || dType === 'dashed') {
          wave(`var(--${dPrefix}color-${dTheme})`);
        }
      }}
    >
      {dIconRight && children}
      {dIcon ? (
        buttonIcon(dLoading)
      ) : (
        <DCollapseTransition
          dRef={iconRef}
          dSize={0}
          dIn={dLoading}
          dDuring={TTANSITION_DURING}
          dHorizontal
          dStyles={{
            entering: { transition: `width ${TTANSITION_DURING}ms linear` },
            leaving: { transition: `width ${TTANSITION_DURING}ms linear` },
            leaved: { display: 'none' },
          }}
        >
          {(collapseStyle) => buttonIcon(true, collapseStyle)}
        </DCollapseTransition>
      )}
      {!dIconRight && children}
      {waveNode}
    </button>
  );
}

export const DButton = React.forwardRef(Button);
