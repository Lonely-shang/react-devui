import type { Updater } from '../../hooks/two-way-binding';
import type { DValue } from './Radio';

import React, { useId, useMemo } from 'react';

import { usePrefixConfig, useComponentConfig, useTwoWayBinding, useGeneralState } from '../../hooks';
import { getClassName } from '../../utils';

export interface DRadioGroupContextData {
  radioGroupName?: string;
  radioGroupValue: DValue;
  radioGroupDisabled: boolean;
  radioGroupType: DRadioGroupProps['dType'];
  onCheckedChange: (checked: DValue) => void;
}
export const DRadioGroupContext = React.createContext<DRadioGroupContextData | null>(null);

export interface DRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  dModel?: [DValue, Updater<DValue>?];
  dFormControlName?: string;
  dName?: string;
  dDisabled?: boolean;
  dType?: 'outline' | 'fill';
  dSize?: 'smaller' | 'larger';
  dVertical?: boolean;
  onModelChange?: (checked: DValue) => void;
}

export function DRadioGroup(props: DRadioGroupProps) {
  const {
    dModel,
    dFormControlName,
    dName,
    dDisabled = false,
    dType,
    dSize,
    dVertical = false,
    onModelChange,
    id,
    className,
    children,
    ...restProps
  } = useComponentConfig(DRadioGroup.name, props);

  //#region Context
  const dPrefix = usePrefixConfig();
  const { gSize, gDisabled } = useGeneralState();
  //#endregion

  const uniqueId = useId();
  const _id = id ?? `${dPrefix}radio-group-${uniqueId}`;

  const [value, changeValue, { ariaAttribute, controlDisabled }] = useTwoWayBinding(
    undefined,
    dModel,
    onModelChange,
    dFormControlName ? { formControlName: dFormControlName, id: _id } : undefined
  );

  const size = dSize ?? gSize;
  const disabled = dDisabled || gDisabled || controlDisabled;

  const contextValue = useMemo<DRadioGroupContextData>(
    () => ({
      radioGroupName: dName,
      radioGroupValue: value,
      radioGroupType: dType,
      radioGroupDisabled: disabled,
      onCheckedChange: (value) => {
        changeValue(value);
      },
    }),
    [changeValue, dName, dType, disabled, value]
  );

  return (
    <DRadioGroupContext.Provider value={contextValue}>
      <div
        {...restProps}
        {...ariaAttribute}
        id={_id}
        className={getClassName(className, `${dPrefix}radio-group`, {
          [`${dPrefix}radio-group--${dType}`]: dType,
          [`${dPrefix}radio-group--${size}`]: size,
          [`${dPrefix}radio-group--vertical`]: dVertical,
        })}
        role="radiogroup"
      >
        {children}
      </div>
    </DRadioGroupContext.Provider>
  );
}
