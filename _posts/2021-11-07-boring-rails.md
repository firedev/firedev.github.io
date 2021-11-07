---
layout: post
title:  "Boring Rails"
category: posts
tags:
  - ruby
  - rails
  - refactoring
image: 'posts/kote-puerto-f4Jyy2OIZ54-unsplash.jpg'
background_size: cover
---

Nintendo is known for using boring technologies. Not the worst plan. Here are some tips on handling complexity on Rails in a boring pragmatic way.

- https://www.youtube.com/watch?v=NbMt4uFIL8c
- https://www.youtube.com/watch?v=Mq6MuwLMEUU

---

<!-- TOC -->

- [Models Hierarchy](#models-hierarchy)
- [State machines](#state-machines)
- [Repositories](#repositories)
- [Presenters](#presenters)
- [Forms Validation and Data Normalization](#forms-validation-and-data-normalization)
- [Controllers Hierarchy](#controllers-hierarchy)
- [Authorization](#authorization)
- [Mutators](#mutators)
- [Service Layer](#service-layer)
- [Dependency Inversion](#dependency-inversion)
- [Null Object](#null-object)
- [Business Logic](#business-logic)
    - [Controller → Business](#controller-%E2%86%92-business)
        - [Return result](#return-result)
        - [Data Validation](#data-validation)
    - [Business → Controller](#business-%E2%86%92-controller)
    - [Business → Business](#business-%E2%86%92-business)
        - [Testing](#testing)
        - [Chaining](#chaining)
    - [DB → Business](#db-%E2%86%92-business)
        - [Transactions](#transactions)

<!-- /TOC -->


## Models Hierarchy

```
models/
  blog_post/
    category.rb
    vote.rb
  code_review/
    submission/
      comment.rb
    submission.rb
  company/
    group/
      member.rb
  course/
    build.rb
    challenge.rb
```

```ruby
# app/models/course/challenge.rb

class Course::Challenge < ApplicationRecord
  validates :exercise
  belongs_to :exercise, inverse_of: :course_challenge
  belongs_to :course
  ...
end
```


## State machines

- [`aasm`](https://github.com/aasm/aasm)

```ruby
state_machine :stripe_state, initial: synchronized, namespace: stripe do
  state :synchronized
  state :synchronizing
  state :invalidated

  event :invalidate do
    transition all: :invalidated
  end

  event :synchronize do
    transition invalidated: :synchronized
  end

  event :mark_as_synchronized do
    transition synchonizing: :synchronized
  end
end
```

## Repositories

```ruby
# app/repositories/lesson_repository.rb

module LessonRepository
  extend ActiveSupport::Concern
  include StateMachine

  included do
    scope :web, -> { approved.joins(:course).merge(Course.web) }
    scope :with_locale, ->(locale) { joins(:course).where(courses: { locale: locale }) }
    scope :with_members, -> { joins("...") }
    ...
```

## Presenters

```ruby
# app/presenters/user_presenter.rb

module UserPresenter
  def public_name
    return full_name if full_name.present?
    return username if username?
  end
```

## Forms Validation and Data Normalization

- [`active_form_model`](https://github.com/Hexlet/active_form_model)

```ruby
# app/forms/user/sign_up_form.rb

class User::SignUpForm < User
  include ActiveFormModel

  permit :email, :password, :first_name

  validates :password, presence: true, length: { minimum: 8 }

  def email=(email)
    if email.present?
      write_attribute(:email, email.downcase)
    else
      super
    end
  end
end
```

## Controllers Hierarchy

```
controllers/
  web/
    projects/
      members/
        comments_controller.rb
    application_controller.rb
  application_controller.rb
```

```ruby
# app/controllers/web/projects/members/comments_controller.rb

class Web::Projects::Members::CommentsController < Web::ApplicationController
  ...
```

## Authorization

Layer above models

- [`pundit`](https://github.com/varvet/pundit)

```ruby
# app/policies/resume/answer/comment_policy.rb

class Resume::Answer::CommentPolicy < ApplicationPolicy
  def edit?
    author?
  end

  def destroy?
    author?
  end

  def update?
    author?
  end
end
```

## Mutators

- Callbacks replacement.
- Anything more complex than `create(params)` goes to mutators.
- Nothing except working with entity

```ruby
# app/mutators/resume/answer_mutator.rb

module Resume::AnswerMutator
  def self.create(resume, params, current_user)
    answer = resume.answers.build params
    answer.user = current_user
    resume.user.notifications.create!(kind: :new_answer, resource: answer) if answer.save
    answer
  end
end
```

## Service Layer

- Synchronous. Stateless.
- [Functional service objects on rails](/posts/functional-service-objects-on-rails/)

```ruby
# app/services/user_service.rb

class UserService
  def self.update_current_tutor(user)
    UserMutator.assign_tutor!(user)
    AnalyticsSender.track(:tutor_assigned, user)
    true
  end
end
```
```ruby
class Web::Projects::Members::CommentsController < Web::Projects::Members::ApplicationController
  before_action :require_email_confirmation!

  def create
    member = Project::Mmember.find(params[:member_id])
    authorize member, :create_comment?

    comment = ProjectService.create_comment(member, current_user, permitted_params)
    if comment.persisted?
      f(:success)
    else
      f(:error)
    end
    redirect_to project_member_path(member.project, member)
  end

  private

  def permitted_params
    params.require(:project_member_comment).permit(:body)
  end
```

## Dependency Inversion

- No monkey-patching
- [dry-rb/dry-container](https://dry-rb.org/gems/dry-container/)

```ruby
if Rails.env.production?
  register :active_campaign, -> { ActivecampaignManager.new configus.ac.api.token }
else
  register :active_compaign, -> { ActivecampaignManagerStub.new }
end

if Rails.env.test?
  register :gitlab_klass, -> { GitlabStub }
else
  register :gitlab_klass, -> { Gitlab }
end
```
```ruby
class AmplitudeJob < ApplicationJob
  include Import['amplitude_klass']

  def perform(event_name, event_data, user_data, options)
    name = EventsMapping.amplitude_names(event_name)
    data = { }
    event = AmplitudeAPI::Event.new(data)
    amplitude_klass.track(event)
  end
end
```

## Null Object

```ruby
- if signed_in? && current_user.friends.any?
```
```ruby
class Guest
  def id; end

  def created_at
    Time.current
  end

  def employee
    nil
  end

  def authenticate(_password)
    false
  end
end
```
```ruby
def current_user
  @current_user ||= User.find_by(id: session[:user_id]) || Guest.new
end
```

## Business Logic

- Business-logic kept isolated from implementation details - Services, Interfaces, DB
- Inject everything


1. Controller → Business
2. Business → Controller
3. Business ←→ Business
4. DB ←→ Business

### 1. Controller → Business

- `Operation` is a good pattern-free word
- Unified Interface
- Railway oriented programming

```
app/
  controllers/
    clients_controller.rb
  operations/
    clients/
      confirmations/
        start.rb
```

```ruby
def create
  operation = Clients::Confirmations::Start.new
  handle_result operation.call(transaction: transaction)
end
```

#### Return result

- Result object
- [`dry-rb/dry-monads`](https://dry-rb.org/gems/dry-monads/)
- [Do Notation](https://dry-rb.org/gems/dry-monads/1.3/do-notation/)

```ruby
class Clients::Confirmations::Start < Operation
  def call(transaction:)
    valid = transaction_eligible? transaction
    return ??? unless valid

    code = generate_code transaction
    return ??? unless code

    result = send_code code
    return ??? unless code

    transaction ???
  end
end
```

```ruby
class Clients::Confirmations::Start < Operation
  def call(transaction:)
    # Success() or Failure(...)
    yield transaction_eligible? transaction
    # Success(code) or Failure(...)
    code = yield generate_code transaction
    # Success() or Failure(...)
    yield send_code code

    Success(transaction)
  end
end
```

#### Data Validation

- Validate user data not domain objects
- Always valid objects
- `dry-rb/dry-validation`[https://dry-rb.org/gems/dry-validation/]

```ruby
class Profile < ApplicationRecord
  validates :name, :birthdate, presence: true
```

```ruby
class ProfileContract < Contract
  params do
    required(:name).filled(:string)
    required(:birthdate).value(:date)
```

### 2. Business → Controller

```ruby
def create
  operation = Clients::Confirmations::Start.new
  handle_result operation.call(transaction: transaction)
end
```

```ruby
def handle_result(result)
  case result
  when Success() then head(:ok)
  when Success then respond_with_data(result.value!)
  when Failure then respond_with_error(result.failure)
  end
end
```

### 3. Business → Business

- Dependency injection
- [https://dry-rb/dry-initializer](https://dry-rb.org/gems/dry-initializer)

```ruby
module Confirmations
  class Start < Operation
    option :generate_code_command,
      reader: :private,
      default: -> { ConfirmationCodes::Generate.new }

    def call(transaction:)
      code = yield generate_code_command.call(source: transaction)
      ...
```

#### Testing

```ruby
describe Clients::Confirmations::Start do
  describe "#call" do
    described_class.new(generate_code_command: generate_code_command).call
  end

  let(:generate_code_command) { instance_double(ConfirmationCodes::Generate) }

  before do
    allow(generate_code_command).to receive(:call).with(...).and_return(...)
  end

  ...
```

#### Chaining

- Railway oriented programming https://vimeo.com/113707214
- Command-Query Segregation

```
   steps
   1   2   3
---*---*---*------ happy path
    \   \   \
------------------ error
```

```ruby
class Clients::Confirmations::Start < Operation
  def call(transaction:)
    # Success() or Failure(...)
    yield transaction_eligible? transaction
    code = yield generate_code transaction
    yield send_code code
     Success(transaction)
  end
end
```

### 4. DB → Business

- Inject repository
- Single Responsibility Principles

```ruby
module Confirmations
  class Generate < Operation
    option :codes_repo,
      reader: :private,
      default: -> { ConfirmationCode }

  private

  def persist_code(code_attributes)
    codes_repo.create!(code_attributes)
  end
end
```

#### Transactions

```ruby
module Confirmation
  class Verify < Operation
    option :repo,
      reader: :private,
      default: -> { ApplicationRecord }

    def call(transaction:, confirmation_code:)
      repo.transaction do
        yield confirm_code(code)
        yield confirm_transaction(transaction)
      end
    end
```
