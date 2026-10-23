/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppTab {
  id: string;
  tabNumber: 1 | 2 | 3 | 4;
  title: string;
  shortName: string;
  subtitle: string;
  description: string;
  githubUrl: string;
  liveUrl: string;
  badge: string;
  iconName: 'BarChart2' | 'Activity' | 'LineChart' | 'GitCommit';
  tags: string[];
  author: string;
}
