---
layout: post
title: "Develop for Joy"
category: posts
tags:
 - development
 - productivity
 - joy
image: posts/paul-pastourmatzis-8kDOOrs608I-unsplash.jpg
background_position: bottom
background_size: cover
---

When you are wearing a team lead hat developer happiness becomes the most important aspect. I hire people smarter than me and care about their well-being. But contract work is a constant pressure. So one of the goals is to prevent the happiness baseline from dipping.

Here are some ideas that helped me in the past broken into three main topics: People, Organization and the Project. See if they are worth your time.

---

# 1. People

I believe we're all born to enjoy our lives. No one has to suffer.

## Refuse to suffer
Make a hard agreement on all the small things. Syntax, variable names, coding standards. Everything should be discussed.

See something preposterous? Say it.

Vote once and let everybody tell what they think. I saw people switching religions sometimes. Consider other ideas. Then lint, fix, improve, and leave it alone. If something doesn't stick - change the rule and continue.

But what if something is still offensive to you?

## Stay friendly
[The Four Agreements](https://www.goodreads.com/book/show/6596.The_Four_Agreements) can be applied to any situation when dealing with people:
1. Be impeccable with your word. Speak with integrity. Do not offend. [Bad is stronger than Good](https://www.researchgate.net/publication/46608952_Bad_Is_Stronger_than_Good)
2. Take nothing personally. There is a huge amount of freedom that comes to you when you do that.
3. Don't make assumptions. Communicate with others as clearly as you can to avoid misunderstandings and drama.
4. Always do your best. Everything is alive and changing all the time, so your best will sometimes be high quality, and other times it will not be as good.

## Hear the woes
Developer happiness is subjective, so you can use WTFs/day. Take note and let the person improve something he feels strongly about. Sometimes it turns out the whole team wants the change, just no one is saying anything. Imagine being triggered by something multiple times a day burning brain fuel and getting stressed.

![](http://www.osnews.com/images/comics/wtfm.jpg)

## Stressless environment
It is not just thinking that gets harder under stress. It is proven that [stress shrinks our prefrontal cortex](https://www.healthline.com/health-news/how-stress-can-shrink-your-brain). In other words, you become dumber and stay that way. This is counterproductive. Under stress, the vision narrows and you turn into a monkey armed with a typewriter.

## The flow
The fleeting sense of [Flow](https://en.wikipedia.org/wiki/Flow_(psychology)) when you are incredibly productive is what you feel when you are working on your [Ikigai](https://en.wikipedia.org/wiki/Ikigai) — something you like, something you are good at, and what you find meaningful. This is what a good organization is for.

# 2. Organization

We are all born with the right to be happy, love, and enjoy our life and our work. The organization should help people get in the flow. Just let go of the people you don't trust and make work better for the ones you do.

## Close tickets
There are many metrics of team productivity. But the main metric is closed tickets. The proof of work is actual work. But here is the tricky part, what makes a good ticket?

## INVEST
Break down the requirements into tasks that are:
- **Independent** — one independent non-blocking feature per ticket
- **Negotiable** — something's odd? Let's discuss
- **Valuable** — have meaning
- **Estimable** — easy to estimate
- **Small**  — not bigger than a day
- **Testable**  — can be automatically tested

## Small tasks
We estimate tasks to know how much we can do, and to not take too much load. I like to use points after Bob Martin's idea. `3` is a "standard task". A "Standard task" you can wrap up before lunch. We use `0`, `1`, `2`, `3`
 and `5` story points relative to the standard task:

- ` 0 ` – I'll close it right away (0~15 min)
- ` 1 ` - Won't take more than an hour
- ` 2 ` – This needs fixing in a couple of places
- ` 3 ` – This will take the whole morning
- ` 5 ` - This is going to take the whole evening
- ` 8 ` - If you feel this is going to take more than a day, please convert it to an Epic and break it down into smaller tasks.

[A more strict](https://blog.borodutch.com/sup-simplified-scrum-for-your-development-team/) version of the same idea is the task can be of any size, but in the sprint backlog, you can have only 1's. Also, see [Microtasking](https://www.yegor256.com/2017/11/28/microtasking.html)](https://www.yegor256.com/2017/11/28/microtasking.html)

## Decompose
Once you decompose you can decide what to do with the original task.
* Close the original task and continue working on a decomposed task.
* Convert it to an Epic with a checklist of subtasks. Subtasks should be closed for this Epic to be considered complete.
This helps to break down complex tasks and measure team velocity. And it looks crazy at first. But that is only until you start completing the Epics. In the end, everything is a subtask of a bigger goal.

## Priorities
Try something simple:

1. ` must `
2. ` want `
3. and the rest

Start from `must` with the least estimate. These are the most low-hanging fruits. `want` is something we want to have eventually but it can wait until the next iteration. The rest — later.

Watch out for `bug` labels, but remember that not every bug should be fixed immediately.

## Let dev go their way
The flow is reachable when people work on something they want to work on the most. Chop tickets so everyone could find jobs they like best. Somebody loves data science, frontend, or testing. Have a ticket for everything.

## Go together
Then let people work in small teams of two or three people on an Epic. That will improve everything. Morale, speed, efficiency. That works incredibly cool when the team is spread across different time zones. The work continues when you are sleeping. That helps to train communication, self-organization, and fill in the blanks for the new people within the project.

## Measure
After a few iterations with the burndown chart. We could predict how much work the team is delivering per sprint. We could do two big business epics, fix some bugs, then maybe resolve some overdue itch. That helped us to better estimate big tasks. Everything was immediately broken down into a "standard epic", something the team can easily do in one sprint or less.

## Chill out
Work hard - play hard. Do not keep the team endlessly crunching. Let them record demos, present their work, and experiment in the scope of an obscure ticket. Let developers create tickets for themselves and close them. Refactor their work or improve the project's flow. This is something they actively want to do, use this power. No one releases on Friday anyway.

Basecamp's [Shape Up](https://basecamp.com/shapeup) method has 2-week cool-down periods between sprints.

## Code preview
Code preview is cheaper than code review. Especially when the work is done and can't be merged. There are different ways to do it. Designs. Diagrams. Comments with code, basically explain how you are going to do it before the code is written. One can even make a draft pull request with a plain text description of what goes where.

See how they are "shaping the work" in [Basecamp](https://basecamp.com/shapeup).

## Reduce friction
If you listen to your developers, especially the newcomers, they are going to tell you everything in their first days and weeks. Just see what they have issues with. Here are the proverbial low-hanging fruits. Pick them and fix them. Make the project as frictionless as possible.

# 3. Project

The project should be a friend, not a foe. It should tender to your code but protect itself from failing tests.

## Make it visible
First, make sure you get all notifications and see everything that is going on before turning them off and filtering them in any way.

## Make you visible
Before working on something make sure there is an open ticket for it. If there is none, create it. This will make everybody live's easier. The changes will be documented and one could see what was going on when opening the code later.

## Low bus factor
There should be as few key people as possible. Key reviewers, key mergers, key admins. Spread the knowledge, train the team, and have smaller tickets. Make it so people could have their lives.

## Automate everything
Before we had to write our automation now GitHub actions seem to do everything. Use it. The project should embrace the code developer produces. Test it, warn about potential issues, assign the reviewers, assign labels, status checks, everything. Whatever your process is - there is a bot just for that.

## Code review
Automatically assigned reviewers prevent bottlenecking. If you are assigned please review it as soon as possible to let others move forward.

Comment on everything that looks concerning. Discuss everything in the comments. [Stay friendly](#stay-friendly). Mention people who might provide insight when needed.

The reviewer can merge or leave it up to the developer. Use [Rebase and Merge](https://github.com/blog/2243-rebase-and-merge-pull-requests) or add a comment and  `Request Changes` if needed. All comments should be marked as resolved by their author before merging.

If you do not agree with something please discuss it in public discussion. Focus on the important, see [Bikeshedding](http://en.wiktionary.org/wiki/bikeshedding)

## Post metrics
Metrics should be a fact of life. For my [EduTech startup](https://demo.learn21.school), we had a dynamic teacher leaderboard in the office and student leaderboards in school. No pressure, but everyone could see how they are doing. Scrum corkboard on the wall with the paper notes that we moved when the task changed state. How things are going was obvious at a glance.

## Green builds
Do not send mixed signals. Every developer waits for green. If you see some build step is always failing, either change it to pending or remove it. There should be positive reinforcement. Plus it's annoying when you have to check the build status manually every time.

## Simple branching
Before there was this craze with `flow`, `git-flow`, `github-flow`. People were foaming at their mouths on how to arrange branches. I like [Trunk-based development](https://trunkbaseddevelopment.com/) with some simple branch naming rules like `0000-task-title`. The `master` branch is always ready to release and continuously deployed to a staging environment after every green build. Red build or a failing migration in `master` is an incident that should be fixed asap.

The rest is optional. I let developers merge their pull requests once everything is green and they feel it's ready.

## Simple commit messages
The first line should describe the commit as much as possible, so it's possible to do `git log --oneline` makes sense. [Conventional commits](https://www.conventionalcommits.org/) seem to work very well with simple prefixes like `feat:` or `fix:`

## One feature – one commit
This makes rollbacks and cherry-picking a non-issue. Plus the history is almost linear, especially if you always rebase. The idea is a bit controversial if you are constantly force-pushing and that makes code hard to review. So one could keep multiple commits until the branch is reviewed and squash on merge.

## Best pull request removes code
The first rule of software quality:
## ` e = mc² `
*) ` errors = more code `

Keep it clean. Clean code is easy to understand and easy to change.

## Best pull request increases coverage
Check coverage at the gate. Write any test, but the coverage should increase.

## Remove deadwood
Close the branches that are sitting there for years. Close obsolete tickets. You ain't gonna need it anyway.

PS. We can reopen them later if needed.

...

Please share what worked for you. And before we part ways, please remember — we were born to have fun.

Please do have fun and organize for joy.
