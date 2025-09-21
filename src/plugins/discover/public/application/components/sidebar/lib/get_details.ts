/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// @ts-ignore
import { i18n } from '@osd/i18n';
import { getFieldValueCounts, getFieldValues, groupValues } from './field_calculator';
import { TOP_VALUES_LIMIT, RARE_VALUES_LIMIT } from './constants';
import { IndexPattern, IndexPatternField } from '../../../../../../data/public';

export function getDetails(
  field: IndexPatternField,
  hits: Array<Record<string, unknown>>,
  indexPattern?: IndexPattern
) {
  const defaultDetails = {
    error: '',
    exists: 0,
    total: 0,
    buckets: [],
  };
  if (!indexPattern) {
    return {
      ...defaultDetails,
      error: i18n.translate('discover.fieldChooser.noIndexPatternSelectedErrorMessage', {
        defaultMessage: 'Index pattern not specified.',
      }),
    };
  }
  // Base details using existing calculator (now defaults to TOP_VALUES_LIMIT)
  const base = getFieldValueCounts({
    hits,
    field,
    indexPattern,
    count: TOP_VALUES_LIMIT,
    grouped: false,
  });

  // Derive unique count and rare buckets from all values in current hits
  const allValues = getFieldValues({ hits, field, indexPattern });
  const missing = allValues.filter((v) => v === undefined || v === null).length;
  const groups = groupValues(allValues, false);
  const uniqueCount = Object.keys(groups).length;
  const denominator = Math.max(1, hits.length - missing);
  const bucketsAll = Object.keys(groups)
    .map((key) => ({
      value: (groups as any)[key].value,
      count: (groups as any)[key].count,
      percent: ((groups as any)[key].count / denominator) * 100,
      display: '', // fill below
    }));

  // Top buckets (desc) and rare buckets (asc)
  const topBuckets = [...bucketsAll]
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_VALUES_LIMIT);
  const rareBuckets = [...bucketsAll]
    .sort((a, b) => a.count - b.count)
    .slice(0, RARE_VALUES_LIMIT);

  // Apply field formatter for display
  for (const b of [...topBuckets, ...rareBuckets]) {
    (b as any).display = indexPattern.getFormatterForField(field).convert(b.value);
  }

  const details = {
    ...defaultDetails,
    ...base,
    buckets: topBuckets,
    uniqueCount,
    rareBuckets,
  } as any;
  return details;
}
