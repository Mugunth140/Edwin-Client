'use client';

import { Button, Flex, Form, Input, InputNumber, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Controller,
  type Control,
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
  type Path,
  useFieldArray,
} from 'react-hook-form';

type LineItemsEditorProps<TFormValues extends FieldValues> = {
  control: Control<TFormValues>;
  name: FieldArrayPath<TFormValues>;
};

export function LineItemsEditor<TFormValues extends FieldValues>({
  control,
  name,
}: LineItemsEditorProps<TFormValues>) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const emptyItem = {
    description: '',
    quantity: 1,
    unit: 'nos',
    rate: 0,
  } as FieldArray<TFormValues, FieldArrayPath<TFormValues>>;

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Typography.Text strong>Line Items</Typography.Text>
        <Button
          icon={<PlusOutlined />}
          onClick={() => append(emptyItem)}
        >
          Add Item
        </Button>
      </Flex>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: 12,
              background: 'rgba(255,255,255,0.025)',
            }}
          >
            <Flex gap={8} align="flex-start" wrap="wrap">
              <Controller
                control={control}
                name={`${name}.${index}.description` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Description"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    style={{ flex: '1 1 240px', marginBottom: 8 }}
                  >
                    <Input {...inputField} placeholder="Civil works, material, labour..." />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.quantity` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Qty"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    style={{ width: 120, marginBottom: 8 }}
                  >
                    <InputNumber
                      min={0}
                      precision={3}
                      style={{ width: '100%' }}
                      value={inputField.value}
                      onChange={inputField.onChange}
                    />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.unit` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Unit"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    style={{ width: 110, marginBottom: 8 }}
                  >
                    <Input {...inputField} placeholder="nos" />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.rate` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Rate"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    style={{ width: 150, marginBottom: 8 }}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      prefix="₹"
                      style={{ width: '100%' }}
                      value={inputField.value}
                      onChange={inputField.onChange}
                    />
                  </Form.Item>
                )}
              />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                aria-label="Remove item"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                style={{ marginTop: 30 }}
              />
            </Flex>
          </div>
        ))}
      </Space>
    </div>
  );
}
