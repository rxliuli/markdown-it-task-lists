/* globals before, describe, it */

import { readFileSync } from 'fs'
import { assert, describe, beforeAll, it, expect } from 'vitest'
import md from 'markdown-it'
import { load, CheerioAPI } from 'cheerio'
import taskLists from '../src/index.js'

describe('markdown-it-task-lists', function () {
  let fixtures: {
      bullet: string
      ordered: string
      mixedNested: string
      dirty: string
    } = {
      bullet: '',
      ordered: '',
      mixedNested: '',
      dirty: '',
    },
    rendered: Record<string, string> = {},
    $: Record<string, CheerioAPI> = {},
    parser: md

  beforeAll(function () {
    var files = {
      bullet: 'bullet.md',
      ordered: 'ordered.md',
      mixedNested: 'mixed-nested.md',
      dirty: 'dirty.md',
    }

    parser = md().use(taskLists)

    for (var key in files) {
      fixtures[key] = readFileSync(
        __dirname + '/fixtures/' + files[key],
      ).toString()
      rendered[key] = parser.render(fixtures[key])
      $[key] = load(rendered[key])
    }
  })

  it('renders tab-indented code differently than default markdown-it', function () {
    var parserDefault = md()
    var parserWithPlugin = md().use(taskLists)
    assert.notEqual(
      parserDefault.render(fixtures.bullet),
      parserWithPlugin.render(fixtures.bullet),
    )
  })

  it('adds input.task-list-item-checkbox in items', function () {
    assert(~$.bullet('input.task-list-item-checkbox').length)
  })

  it('renders items marked up as [ ] as unchecked', function () {
    var shouldBeUnchecked = (fixtures.ordered.match(/[\.\*\+-]\s+\[ \]/g) || [])
      .length
    expect(shouldBeUnchecked).toBe(
      $.ordered('input[type=checkbox].task-list-item-checkbox:not(:checked)')
        .length,
    )
  })

  it('renders items marked up as [x] as checked', function () {
    var shouldBeChecked = (
      fixtures.ordered.match(/[\.\*\+-]\s+\[[Xx]\]/g) || []
    ).length
    expect(shouldBeChecked).toBe(
      $.ordered('input[type=checkbox].task-list-item-checkbox:checked').length,
    )
  })

  it('disables the rendered checkboxes', function () {
    assert(
      !$.bullet('input[type=checkbox].task-list-item-checkbox:not([disabled])')
        .length,
    )
  })

  it('enables the rendered checkboxes when options.enabled is truthy', function () {
    var enabledParser = md().use(taskLists, { enabled: true })
    var $$ = load(enabledParser.render(fixtures.ordered))
    assert(
      $$('input[type=checkbox].task-list-item-checkbox:not([disabled])')
        .length > 0,
    )
  })

  it('adds class `enabled` to <li> elements when options.enabled is truthy', function () {
    var enabledParser = md().use(taskLists, { enabled: true })
    var $$ = load(enabledParser.render(fixtures.ordered))
    expect($$('.task-list-item:not(.enabled)').length).toBe(0)
  })

  it('skips rendering wrapping <label> elements', function () {
    expect($.bullet('label').length).toBe(0)
    expect($.ordered('label').length).toBe(0)
    expect($.mixedNested('label').length).toBe(0)
    expect($.dirty('label').length).toBe(0)
  })

  it('does not render wrapping <label> elements when options.label is falsy', function () {
    var unlabeledParser = md().use(taskLists, { label: false })
    var $$ = load(unlabeledParser.render(fixtures.ordered))
    expect($$('label').length).toBe(0)
  })

  it("wraps the rendered list items' contents in a <label> element when options.label is truthy", function () {
    var labeledParser = md().use(taskLists, { label: true })
    var $$ = load(labeledParser.render(fixtures.ordered))
    assert(
      $$(
        '.task-list-item > label > input[type=checkbox].task-list-item-checkbox',
      ).length > 0,
    )
  })

  it('wraps and enables items when options.enabled and options.label are truthy', function () {
    var enabledLabeledParser = md().use(taskLists, {
      enabled: true,
      label: true,
    })
    var $$ = load(enabledLabeledParser.render(fixtures.ordered))
    assert(
      $$(
        '.task-list-item > label > input[type=checkbox].task-list-item-checkbox:not([disabled])',
      ).length > 0,
    )
  })

  it('adds label after items when options.label and options.labelAfter are truthy', function () {
    var enabledLabeledParser = md().use(taskLists, {
      enabled: true,
      label: true,
      labelAfter: true,
    })
    var $$ = load(enabledLabeledParser.render(fixtures.ordered))
    assert(
      $$(
        '.task-list-item > input[type=checkbox].task-list-item-checkbox:not([disabled])',
      )
        .next()
        .is('label'),
    )
  })

  it('does NOT render [  ], "[ ]" (no space after closing bracket), [ x], [x ], or [ x ] as checkboxes', function () {
    var html = $.dirty.html()
    assert(~html.indexOf('<li>[  ]'))
    assert(~html.indexOf('<li>[ ]</li>'))
    assert(~html.indexOf('<li>[x ]'))
    assert(~html.indexOf('<li>[ x]'))
    assert(~html.indexOf('<li>[ x ]'))
  })

  it('adds class .task-list-item to parent <li>', function () {
    assert(~$.bullet('li.task-list-item').length)
  })

  it('adds class .contains-task-list to lists', function () {
    assert(~$.bullet('ol.contains-task-list, ul.contains-task-list').length)
  })

  it('only adds .contains-task-list to most immediate parent list', function () {
    assert(
      $.mixedNested('ol:not(.contains-task-list) ul.contains-task-list').length,
    )
  })
})
